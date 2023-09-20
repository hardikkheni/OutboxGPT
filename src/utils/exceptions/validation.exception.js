const { StatusCodes } = require('http-status-codes');

module.exports = class ValidationException extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.errors = errors;
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
};
