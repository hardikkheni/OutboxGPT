const mongoose = require('mongoose');
const { timestamps, userId, defaultOptions } = require('../../constants/db.constant');
const { ProviderType } = require('../../constants/enum.constant');

const AccountSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true },
    provider: { type: String, required: true, default: ProviderType.Google, enum: Object.values(ProviderType) },
    signature: { type: String },
    tokens: {
      [ProviderType.Google]: {
        refreshToken: { type: String },
        accessToken: { type: String },
      },
      [ProviderType.Microsoft]: {
        refreshToken: { type: String },
        accessToken: { type: String },
        homeAccountId: { type: String },
      },
    },
    userId,
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const Account = mongoose.model('Account', AccountSchema);
module.exports = Account;
