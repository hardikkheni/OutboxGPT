const mongoose = require('mongoose');
const { timestamps, defaultOptions } = require('../../constants/db.constant');

const ContactUsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company_name: { type: String, required: true },
    message: { type: String, required: true },
  },
  {
    ...defaultOptions,
    timestamps,
  }
);

const ContactUs = mongoose.model('ContactUs', ContactUsSchema);
module.exports = ContactUs;
