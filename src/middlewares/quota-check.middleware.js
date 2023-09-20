const { quotaCheck } = require('../constants/plan.contant');
const { AccountModel } = require('../db/models');
const { PaymentRequiredException } = require('../utils/exceptions');
const asyncHandler = require('../utils/helpers/async.helper');

module.exports = (feature) => {
  return asyncHandler(async (req) => {
    const quota = req.user.subscription.quota;
    switch (feature) {
      // Check account quota
      case quotaCheck.ACCOUNT:
        if (!quota.unlimited_accounts) {
          const accounts = await AccountModel.count({ userId: req.user._id });
          if (!(quota.accounts > accounts)) {
            throw new PaymentRequiredException('You have reached your account limit. Please upgrade your plan to continue using our service.');
          }
        }
        break;

      // Check campaign is enabled in quota
      case quotaCheck.CAMPAIGN:
        if (!quota.unlimited_campaigns && !(quota.campaigns > 0)) {
          throw new PaymentRequiredException('You have reached your campaign limit. Please upgrade your plan to continue using our service.');
        }
        break;

      case quotaCheck.EMAIL:
        if (!quota.unlimited_emails && !(quota.emails > 0)) {
          throw new PaymentRequiredException('You have reached your email limit. Please upgrade your plan to continue using our service.');
        }
        break;

      // case quotaCheck.INTEGRATION:
      //   if (!(quota.integrations > 0)) {
      //     throw new PaymentRequiredException('The have reached your integration limit. Please upgrade your plan to continue using our service.');
      //   }
      //   break;
    }
  });
};
