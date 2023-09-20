const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { PlanStatus, PlanInterval } = require('../constants/enum.constant');
const jobConstants = require('../constants/job.constant');
const { UserModel } = require('../db/models');
const agendaService = require('../services/agenda.service');

module.exports = [
  [
    jobConstants.stripeJobs.RESTORE_MONTHLY_QOUTA,
    async (job) => {
      const { userId } = job.attrs.data;
      if (!mongoose.isValidObjectId(userId)) return;
      const user = await UserModel.findOne({ _id: new mongoose.Types.ObjectId(userId) }).populate('subscription.order');
      if (!user) return;
      const order = user.subscription.order;
      if (user.subscription.status === PlanStatus.Active && order) {
        user.subscription.quota = order.features;
        await user.save();
        if (order.lastActivedAt && order.recurring.interval === PlanInterval.Year) {
          if (dayjs().add(1, 'month').isBefore(dayjs(order.lastActivedAt).add(1, 'year'))) {
            agendaService.schedule('in 1 month', jobConstants.stripeJobs.RESTORE_MONTHLY_QOUTA, { userId: user._id.toString() });
          }
        }
      }
    },
  ],
];
