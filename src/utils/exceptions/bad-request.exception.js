const { StatusCodes } = require('http-status-codes');

module.exports = class BadRequestException extends Error {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
};
