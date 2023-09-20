const mongoose = require('mongoose');
const { timestamps, userId, defaultOptions, freePlanQuota } = require('../../constants/db.constant');
const { PaymentStatus, PlanType } = require('../../constants/enum.constant');
const { RecurringSchema, FeatureSchema } = require('../schemas');

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      unique: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    subscriptionId: { type: String, required: true },
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
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
    },
    lastActivedAt: { type: Date },
    userId,
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const res = await this.db
      .collection('counters')
      .findOneAndUpdate({ _id: this.collection.name }, { $inc: { nextId: 1 } }, { returnOriginal: false, upsert: true });
    this.orderId = 10001 + (res.value?.nextId || 0);
  }
  next();
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
