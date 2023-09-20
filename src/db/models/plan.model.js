const mongoose = require('mongoose');
const { timestamps, defaultOptions, freePlanQuota } = require('../../constants/db.constant');
const { PlanType } = require('../../constants/enum.constant');
const { FeatureSchema, RecurringSchema } = require('../schemas');

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    productId: { type: String, required: true },
    priceId: { type: String, required: true },
    price: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(PlanType),
      default: PlanType.OneTime,
    },
    recurring: {
      type: RecurringSchema,
      default: null,
    },
    features: {
      type: FeatureSchema,
      required: true,
      default: freePlanQuota,
    },
    active: {
      type: Boolean,
      default: false,
    },
    details: {
      type: [{ type: String, required: true }],
    },
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const Plan = mongoose.model('Plan', PlanSchema);
module.exports = Plan;
