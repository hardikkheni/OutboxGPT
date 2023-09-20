const mongoose = require('mongoose');
const { timestamps, userId, defaultOptions } = require('../../constants/db.constant');

const CardSchema = new mongoose.Schema(
  {
    payId: { type: String, required: true },
    brand: { type: String, required: true },
    last4: { type: String, required: true },
    exp: {
      month: { type: Number, required: true },
      year: { type: Number, required: true },
    },
    userId,
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const Card = mongoose.model('Card', CardSchema);
module.exports = Card;
