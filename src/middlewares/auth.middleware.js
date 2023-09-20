const mongoose = require('mongoose');
const { UnauthorizedException } = require('../utils/exceptions');
const asyncHandler = require('../utils/helpers/async.helper');
const jwt = require('../utils/helpers/jwt.helper');
const { UserModel } = require('../db/models');

module.exports = asyncHandler(async (req) => {
  try {
    const authorizedTokenString = req.headers.authorization;
    if (!authorizedTokenString) {
      throw new UnauthorizedException('Access denied!.');
    }
    if (!(authorizedTokenString && authorizedTokenString.split(' ')[1])) {
      throw new UnauthorizedException('Access denied!.');
    }
    const accessToken = authorizedTokenString.split(' ')[1];
    const decodedToken = jwt.verify(accessToken);
    const userId = new mongoose.Types.ObjectId(decodedToken._id);
    const user = await UserModel.findOne({ _id: userId }).populate('subscription.order');
    if (!user) throw new UnauthorizedException('Access denied!.');
    req.user = user;
  } catch (error) {
    throw new UnauthorizedException('Access denied!.');
  }
});
