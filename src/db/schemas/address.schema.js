const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    city: { type: String },
    country: { type: String },
    line1: { type: String },
    line2: { type: String },
    postal_code: { type: String },
    state: { type: String },
  },
  { _id: false }
);

module.exports = AddressSchema;
