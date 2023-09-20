const mongoose = require('mongoose');
const { timestamps, userId, defaultOptions } = require('../../constants/db.constant');
const { CampaignStatus } = require('../../constants/enum.constant');

const CampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fromId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, default: CampaignStatus.Active, enum: Object.values(CampaignStatus) },
    userId,
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const Campaign = mongoose.model('Campaign', CampaignSchema);
module.exports = Campaign;
