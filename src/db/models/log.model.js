const mongoose = require('mongoose');
const { timestamps, defaultOptions, userId } = require('../../constants/db.constant');
const { LogType } = require('../../constants/enum.constant');

const LogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(LogType),
      default: LogType.Email,
    },
    userId,
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const Log = mongoose.model('Log', LogSchema);
module.exports = Log;
