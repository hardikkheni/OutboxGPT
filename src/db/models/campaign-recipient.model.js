const mongoose = require('mongoose');
const { timestamps, userId, defaultOptions } = require('../../constants/db.constant');
const { MailStatus } = require('../../constants/enum.constant');

const CampaignRecipientSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    status: { type: String, default: MailStatus.Pending, enum: Object.values(MailStatus) },
    messageId: { type: String },
    userId,
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const CampaignRecipient = mongoose.model('CampaignRecipient', CampaignRecipientSchema);
module.exports = CampaignRecipient;
