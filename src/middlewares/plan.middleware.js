const { PlanStatus } = require('../constants/enum.constant');
const { PaymentRequiredException } = require('../utils/exceptions');
const asyncHandler = require('../utils/helpers/async.helper');

module.exports = asyncHandler(async (req) => {
  const user = req.user;
  if (user.subscription.order && user.subscription.status !== PlanStatus.Active) {
    throw new PaymentRequiredException('Your plan is expired. Please renew your plan to continue using our service.');
  }
});
