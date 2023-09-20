const mongoose = require('mongoose');
const { timestamps, defaultOptions, userId, freePlanQuota } = require('../../constants/db.constant');
const { InvoiceStatus } = require('../../constants/enum.constant');
const { FeatureSchema } = require('../schemas');

const InvoiceSchema = new mongoose.Schema(
  {
    subscriptionId: { type: String, required: true },
    invoiceId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, default: InvoiceStatus.Unpaid, enum: Object.values(InvoiceStatus) },
    links: {
      view: { type: String, required: true },
      pdf: { type: String, required: true },
    },
    userId,
    features: {
      type: FeatureSchema,
      required: true,
      default: freePlanQuota,
    },
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const Invoice = mongoose.model('Invoice', InvoiceSchema);
module.exports = Invoice;
