const mongoose = require('mongoose');

module.exports = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  defaultOptions: {
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
  freePlanQuota: {
    accounts: 1,
    unlimited_accounts: false,
    emails: 10,
    unlimited_emails: false,
    history: false,
    campaigns: 1,
    unlimited_campaigns: false,
    integrations: 1,
    unlimited_integrations: false,
  },
  emptyPlanQuota: {
    accounts: 1,
    unlimited_accounts: false,
    emails: 10,
    unlimited_emails: false,
    history: false,
    campaigns: 1,
    unlimited_campaigns: false,
    integrations: 1,
    unlimited_integrations: false,
  },
};
