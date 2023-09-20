const mongoose = require('mongoose');
const { AccountModel, CampaignModel, CampaignRecipientModel, LogModel, InvoiceModel } = require('../db/models');
const { ValidationException, NotFoundException } = require('../utils/exceptions');
const { StatusCodes } = require('http-status-codes');
const msService = require('../services/ms.service');
const googleService = require('../services/google.service');
const { ProviderType, MailStatus, LogType } = require('../constants/enum.constant');
const { format: textFormat } = require('../utils/helpers/text.helper');
const { google } = require('googleapis');

async function create(req, res) {
  const { body: data } = req;
  const from = await AccountModel.findOne({ _id: new mongoose.Types.ObjectId(data.fromId) });
  if (!from) throw new ValidationException('From account not found.', { fromId: 'From account not found.' });

  // const recps = await CampaignRecipientModel.count({ userId: req.user._id, status: { $in: [MailStatus.Draft, MailStatus.Pending] } });
  const quota = req.user.subscription.quota;
  // if (!quota.unlimited_emails && !(quota.emails >= recps + data.recipients.length)) {
  if (!quota.unlimited_emails && !(quota.emails >= data.recipients.length)) {
    throw new ValidationException(`You have only ${quota.emails} emails left. Please upgrade your plan to send more mails.`, {});
  }

  const campaign = await CampaignModel.create({
    name: data.name,
    fromId: from._id,
    subject: data.subject,
    body: data.body,
    userId: req.user._id,
  });

  const recipients = await Promise.all(
    data.recipients.map(async (recipient) => {
      return await CampaignRecipientModel.create({
        name: recipient.name,
        email: recipient.email,
        campaignId: campaign._id,
        userId: req.user._id,
      });
    })
  );
  await req.user.campaignAdded();

  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    data: {
      ...campaign.toJSON(),
      from,
      recipients: recipients,
    },
    message: 'Campaign created successfully.',
  });
}

async function list(req, res) {
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 10);
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const sort = {
    field: req.query.sort?.field || 'from.name',
    dir: req.query.sort?.dir === 'desc' ? -1 : 1,
  };
  const query = [
    {
      $match: { userId: req.user._id },
    },
    {
      $lookup: {
        from: 'accounts',
        localField: 'fromId',
        foreignField: '_id',
        as: 'from',
      },
    },
    {
      $unwind: {
        path: '$from',
      },
    },
    ...(search
      ? [
          {
            $match: {
              $or: [
                {
                  subject: { $regex: search, $options: 'i' },
                },
                {
                  body: { $regex: search, $options: 'i' },
                },
                {
                  name: { $regex: search, $options: 'i' },
                },
                {
                  status: { $regex: search, $options: 'i' },
                },
                {
                  'from.name': { $regex: search, $options: 'i' },
                },
                {
                  'from.email': { $regex: search, $options: 'i' },
                },
              ],
            },
          },
        ]
      : []),
    {
      $lookup: {
        from: 'campaignrecipients',
        localField: '_id',
        foreignField: 'campaignId',
        as: 'campaignRecipients',
      },
    },
    {
      $addFields: {
        recipients: {
          list: { $slice: ['$campaignRecipients', -2] },
          count: { $size: '$campaignRecipients' },
        },
      },
    },
    {
      $unset: ['campaignRecipients', 'from.tokens'],
    },
  ];
  const total = await CampaignModel.aggregate([...query, { $count: 'total' }]);
  const campaigns = await CampaignModel.aggregate([...query, { $sort: { [sort.field]: sort.dir } }])
    .skip(skip)
    .limit(limit);
  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Campaigns fetched successfully.',
    data: { data: campaigns, total: total?.[0]?.total || 0 },
  });
}

async function findById(req, res) {
  const campaign = await CampaignModel.aggregate([
    {
      $match: { userId: req.user._id, _id: new mongoose.Types.ObjectId(req.params.id) },
    },
    {
      $lookup: {
        from: 'accounts',
        localField: 'fromId',
        foreignField: '_id',
        as: 'from',
      },
    },
    {
      $unwind: {
        path: '$from',
      },
    },
    {
      $lookup: {
        from: 'campaignrecipients',
        localField: '_id',
        foreignField: 'campaignId',
        as: 'recipients',
      },
    },
    {
      $unset: ['from.tokens'],
    },
    {
      $limit: 1,
    },
  ]);
  if (!campaign) throw new NotFoundException('Campaign not found!.');
  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Campaign fetched successfully.',
    data: campaign?.[0],
  });
}

async function deleteById(req, res) {
  const campaign = await CampaignModel.findOne({
    userId: req.user._id,
    _id: new mongoose.Types.ObjectId(req.params.id),
  });
  if (!campaign) throw new NotFoundException('Campaign not found!.');
  await CampaignRecipientModel.deleteMany({ campaignId: campaign._id });
  await campaign.deleteOne();
  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Campaign deleted successfully.',
  });
}

async function createDraft(req, res) {
  let draft;
  let url;
  const recipientId = req.body.recipientId;
  const recipient = await CampaignRecipientModel.findOne({ _id: new mongoose.Types.ObjectId(recipientId) });
  if (!recipient) throw new NotFoundException('Recipient not found!.');
  const campaign = await CampaignModel.findOne({ _id: recipient.campaignId });
  if (!campaign) throw new NotFoundException('Campaign not found!.');
  const from = await AccountModel.findOne({ _id: campaign.fromId });
  if (!from) throw new NotFoundException('From account not found!.');

  const obj = { name: recipient.name, email: recipient.email, campaign: campaign.name, signature: from.signature };

  try {
    if (from.provider === ProviderType.Microsoft) {
      draft = await msService.draft.create(from.tokens[ProviderType.Microsoft] || {}, {
        subject: textFormat(campaign.subject, obj),
        importance: 'NORMAL',
        body: {
          // NOTE: this can be HTML or TEXT.
          contentType: 'HTML',
          content: textFormat(campaign.body, obj),
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipient.email,
            },
          },
        ],
      });
      // this how to search for draft
      // https://graph.microsoft.com/v1.0/me/messages?$filter=internetMessageId eq '%3CPH7PR20MB544463575BF7E592D3356846E530A%40PH7PR20MB5444.namprd20.prod.outlook.com%3E'
      recipient.messageId = draft.internetMessageId;
      recipient.status = MailStatus.Draft;
      await recipient.save();
      // url = `https://outlook.live.com/mail/0/deeplink/compose/${encodeURIComponent(draft.id)}/?ItemID=${encodeURIComponent(draft.id)}&exvsurl=1`;
      // url = `https://outlook.office.com/mail/drafts/id/${draft.id}/view`;
      url = `https://outlook.live.com/mail/${from.email}/compose/${encodeURIComponent(draft.id).replaceAll('_', '%2B')}`;
    } else if (from.provider === ProviderType.Google) {
      const auth = googleService.getGoogleAuth(from.tokens[ProviderType.Google].refreshToken);
      draft = await google.gmail({ auth, version: 'v1' }).users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: Buffer.from(
              `From: ${from.email}\n` +
                `To: ${recipient.email}\n` +
                `Subject: ${textFormat(campaign.subject, obj)}\n` +
                `Content-Type: text/html; charset="UTF-8"\n\n` +
                `${textFormat(campaign.body, obj)}`
            ).toString('base64'),
          },
        },
      });
      recipient.messageId = draft.data.message.id;
      recipient.status = MailStatus.Draft;
      await recipient.save();
      url = `https://mail.google.com/mail/u/${from.email}/#inbox?compose=${draft.data.message.id}`;
    }
  } catch (err) {
    console.log(err, 'err');
    throw new Error('Failed to create draft.');
  }

  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Draft created successfully.',
    data: {
      url,
    },
  });
}

async function watchStatus(req, res) {
  let shouldUpdate = false;
  const campaign = await CampaignModel.findOne({ _id: req.body.campaignId });
  if (!campaign) throw new NotFoundException('Campaign not found!.');
  const from = await AccountModel.findOne({ _id: campaign.fromId });
  if (!from) throw new NotFoundException('From account not found!.');

  const recipients = await CampaignRecipientModel.find({
    campaignId: campaign._id,
    _id: { $in: req.body.recipientIds.map((id) => new mongoose.Types.ObjectId(id)) },
  });

  if (from.provider === ProviderType.Google) {
    const auth = googleService.getGoogleAuth(from.tokens[ProviderType.Google].refreshToken);
    const gmail = google.gmail({ auth, version: 'v1' });
    const result = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SENT'],
    });
    if (result.data.messages.length > 0) {
      for (const msg of result.data.messages) {
        const recp = recipients.find((i) => i.messageId === msg.threadId);
        if (recp) {
          try {
            const message = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
            });
            if (message && message?.data) {
              if (message?.data?.labelIds?.includes('SENT')) {
                const recipient = await CampaignRecipientModel.findOne({ _id: recp._id, status: { $ne: MailStatus.Sent } });
                if (recipient) {
                  recipient.status = MailStatus.Sent;
                  await recipient.save();
                  await req.user.emailAdded();
                  const lastInvoice = await InvoiceModel.findOne({ userId: req.user._id }).sort({ created_at: -1 });
                  await LogModel.create({
                    campaignId: campaign._id,
                    recipientId: recipient._id,
                    type: LogType.Email,
                    userId: req.user._id,
                    invoiceId: lastInvoice?._id,
                  });
                }
                shouldUpdate = true;
              }
            }
          } catch {}
        }
      }
    }
  } else if (from.provider === ProviderType.Microsoft) {
    for (const recp of recipients) {
      const msgs = await msService.messages.findByInternetMessageId(from.tokens[ProviderType.Microsoft], recp.messageId);
      if (msgs?.value?.length > 0) {
        const msg = msgs?.value?.[0];
        if (msg && Object(msg).hasOwnProperty('isDraft') && !msg.isDraft) {
          const recipient = await CampaignRecipientModel.findOne({ _id: recp._id, status: { $ne: MailStatus.Sent } });
          if (recipient) {
            recipient.status = MailStatus.Sent;
            await recipient.save();
            await req.user.emailAdded();
            const lastInvoice = await InvoiceModel.findOne({ userId: req.user._id }).sort({ created_at: -1 });
            await LogModel.create({
              campaignId: campaign._id,
              recipientId: recipient._id,
              type: LogType.Email,
              userId: req.user._id,
              invoiceId: lastInvoice?._id,
            });
          }
          shouldUpdate = true;
        }
      }
    }
  }
  return res.status(StatusCodes.OK).send({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Email Status refreshed!.',
    data: shouldUpdate,
  });
}

module.exports = { create, list, findById, deleteById, createDraft, watchStatus };
