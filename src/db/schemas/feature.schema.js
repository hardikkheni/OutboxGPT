const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema(
  {
    accounts: { type: Number, required: true, default: 0 },
    unlimited_accounts: { type: Boolean, default: false },
    emails: { type: Number, required: true, default: 0 },
    unlimited_emails: { type: Boolean, default: false },
    history: { type: Boolean, required: true, default: false },
    campaigns: { type: Number, required: true, default: 0 },
    unlimited_campaigns: { type: Boolean, default: false },
    integrations: { type: Number, required: true, default: 0 },
    unlimited_integrations: { type: Boolean, default: false },
  },
  { _id: false }
);

module.exports = FeatureSchema;
