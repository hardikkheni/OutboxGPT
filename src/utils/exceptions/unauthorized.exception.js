const { StatusCodes } = require('http-status-codes');

module.exports = class UnauthorizedException extends Error {
  constructor(message = 'Invalid username and password.') {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
};
