const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

function sign(payload, options = {}) {
  return jwt.sign(payload, SECRET, options);
}

function verify(token, options = {}) {
  try {
    return jwt.verify(token, SECRET, options);
  } catch {
    throw new Error('JWT token invalid!.');
  }
}

module.exports = {
  sign,
  verify,
};
