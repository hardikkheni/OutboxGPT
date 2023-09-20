const { StatusCodes } = require('http-status-codes');
const { AccountModel, CampaignModel, UserModel } = require('../db/models');
const { ValidationException, NotFoundException, PaymentRequiredException } = require('../utils/exceptions');
const { ProviderType, PlanStatus } = require('../constants/enum.constant');
const googleService = require('../services/google.service');
const msService = require('../services/ms.service');
const mongoose = require('mongoose');

async function list(req, res) {
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 10);
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  let total = [{ total: 0 }];
  let accounts = [];
  const query = [
    {
      $match: { userId: req.user._id },
    },
    ...(search
      ? [
          {
            $match: {
              $or: [
                {
                  name: { $regex: search, $options: 'i' },
                },
                {
                  email: { $regex: search, $options: 'i' },
                },
              ],
            },
          },
        ]
      : []),
    {
      $project: {
        name: 1,
        email: 1,
        provider: 1,
        created_at: 1,
        updated_at: 1,
        userId: 1,
        signature: 1,
      },
    },
  ];
  if (limit > 0) {
    total = await AccountModel.aggregate([...query, { $count: 'total' }]);
    accounts = await AccountModel.aggregate([...query])
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
  } else {
    accounts = await AccountModel.aggregate([...query]).sort({ created_at: -1 });
  }

  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Accounts fetched successfully.',
    data: { data: accounts, total: total?.[0]?.total || 0 },
  });
}

async function create(req, res) {
  const newAccount = req.body;
  if (!req.user.subscription.quota.unlimited_integrations && !(req.user.subscription.quota.integrations >= 1)) {
    throw new PaymentRequiredException("Your plan doesn't include Google integration. Please upgrade your plan to continue using our service.");
  }
  if (req.body.provider === ProviderType.Google) {
    try {
      const tokens = await googleService.getAccessToken(req.body.code);
      const { data: googleUser } = await googleService.getUserInfo(tokens.refresh_token);
      newAccount.email = googleUser.email;
      newAccount.name = googleUser.name;
      newAccount.tokens = {
        [ProviderType.Google]: {
          refreshToken: tokens.refresh_token,
        },
      };
    } catch (err) {
      throw new ValidationException(`Google varification failed!. err: (${err.message})`, [{ code: 'invalid code!.' }]);
    }
  } else if (req.body.provider === ProviderType.Microsoft) {
    throw new Error("Failed to get user's info from Outlook.");
  }

  let account = await AccountModel.findOne({ userId: req.user._id, email: newAccount.email });
  if (account) throw new ValidationException('Account already exists.', { email: ['email already exists.'] });
  const { tokens, ...rest } = (await AccountModel.create({ ...newAccount, userId: req.user._id })).toJSON();
  // await req.user.accountAdded();
  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Account created successfully.',
    data: rest,
  });
}

async function findById(req, res) {
  const account = await AccountModel.findOne({ _id: req.params.id, userId: req.user._id }, { tokens: 0 });
  if (!account) throw new NotFoundException('Account not found.');
  const { tokens, ...rest } = account.toJSON();
  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Account fetched successfully.',
    data: rest,
  });
}

async function deleteById(req, res) {
  const account = await AccountModel.findOne({ _id: req.params.id, userId: req.user._id });
  if (!account) throw new NotFoundException('Account not found.');
  const campaign = await CampaignModel.findOne({ fromId: req.params.id });
  if (campaign) throw new ValidationException('Account is in use.', {});
  await account.deleteOne();
  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Account deleted successfully.',
  });
}

async function updateById(req, res) {
  const account = await AccountModel.findOne({ _id: req.params.id, userId: req.user._id });
  if (!account) throw new NotFoundException('Account not found.');
  account.signature = req.body.signature;
  await account.save();
  const { tokens, ...rest } = account.toJSON();
  return res.status(StatusCodes.OK).send({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Account updated successfully.',
    data: rest,
  });
}

async function getMsLink(req, res) {
  const url = await msService.getAuthLink();
  if (!req.session.ms) {
    req.session.ms = {};
  }
  req.session.ms.user_id = req.query.user_id;
  return res.redirect(url);
}

async function varifyMsCode(req, res) {
  const userId = new mongoose.Types.ObjectId(req.session.ms.user_id);
  const tokenRequest = {
    code: req.query.code,
    clientInfo: req.query.client_info,
  };
  const user = await UserModel.findById(req.session.ms.user_id).populate('subscription.order');
  if (!user) {
    return res.redirect(`${process.env.DOMAIN_URL}/Profile?status=errored&message=User not found!.`);
  }
  if (user.subscription.order && user.subscription.status !== PlanStatus.Active) {
    return res.redirect(`${process.env.DOMAIN_URL}/Profile?status=errored&message=Please activate your subscription first!.`);
  }
  if (!user.subscription.quota.unlimited_accounts) {
    const accounts = await AccountModel.count({ userId });
    if (!(user.subscription.quota.accounts > accounts)) {
      return res.redirect(
        `${process.env.DOMAIN_URL}/Profile?status=errored&message=You have reached your account limit. Please upgrade your plan to continue using our service.`
      );
    }
  }

  if (!user.subscription.quota.unlimited_integrations && !(user.subscription.quota.integrations >= 2)) {
    return res.redirect(
      `${process.env.DOMAIN_URL}/Profile?status=errored&message=Your plan doesn't include Outlook integration. Please upgrade your plan to continue using our service.`
    );
  }
  try {
    const data = await msService.acquireTokenByCode(tokenRequest);
    const me = await msService.me({ refreshToken: data.refreshToken });
    await AccountModel.create({
      userId,
      name: me.displayName?.trim() || me.mail?.split('@')[0],
      email: me.mail,
      provider: ProviderType.Microsoft,
      tokens: {
        [ProviderType.Microsoft]: {
          refreshToken: data.refreshToken,
          accessToken: data.accessToken,
          homeAccountId: me.homeAccountId,
        },
      },
    });
    // await user.accountAdded();
    return res.redirect(`${process.env.DOMAIN_URL}/Profile?status=succeeded&message=Account added successfully.`);
  } catch (err) {
    console.log('============================================');
    console.log('err', err);
    console.log('============================================');
    return res.redirect(`${process.env.DOMAIN_URL}/Profile?status=errored&message=Failed to add account.`);
  }
}

module.exports = { list, create, findById, deleteById, updateById, getMsLink, varifyMsCode };
