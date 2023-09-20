const mongoose = require('mongoose');
const { PlanInterval } = require('../../constants/enum.constant');

const RecurringSchema = new mongoose.Schema(
  {
    interval: {
      type: String,
      required: true,
      enum: Object.values(PlanInterval),
      default: PlanInterval.Month,
    },
    interval_count: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { _id: false }
);

module.exports = RecurringSchema;
