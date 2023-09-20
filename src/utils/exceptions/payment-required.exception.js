const { StatusCodes } = require('http-status-codes');

module.exports = class PaymentRequiredException extends Error {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.PAYMENT_REQUIRED;
  }
};
