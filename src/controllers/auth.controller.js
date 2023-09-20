const { StatusCodes } = require('http-status-codes');
const { UserModel, ContactUsModel, InvoiceModel, LogModel, AccountModel } = require('../db/models');
const jwt = require('../utils/helpers/jwt.helper');
const fbService = require('../services/fire.service');
const smtpService = require('../services/smtp.service');
const { ValidationException, NotFoundException, UnauthorizedException } = require('../utils/exceptions');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const { LogType } = require('../constants/enum.constant');

async function register(req, res) {
  let user = await UserModel.findOne({ email: { $regex: `^${req.body.email}$`, $options: 'i' } }).populate('subscription.order');
  if (user && user.is_active) {
    throw new ValidationException('User already exists.', { email: ['email already used!.'] });
  }
  if (!user) {
    user = await UserModel.create({
      ...req.body,
      email: req.body.email.toLowerCase(),
      avatar: `https://ui-avatars.com/api/?name=${req.body.name}&background=000&color=fff`,
      is_active: false,
    });
  }
  const token = await jwt.sign({ id: user._id.toString() }, { expiresIn: '600000ms' });
  let { password: _password, ...data } = user.toJSON();
  smtpService.sendInviteLink({ to: { name: user.name, email: user.email } }, { url: `${process.env.DOMAIN_URL}/Invite/${token}` });
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'You have been registered successfully. Please check your email to verify your account',
    data,
  });
}

async function verify(req, res) {
  let user;
  try {
    const data = await jwt.verify(req.body.token);
    user = await UserModel.findOne({ _id: new mongoose.Types.ObjectId(data.id) }).populate('subscription.order');
  } catch (err) {
    throw new ValidationException('Invalid token.', { token: ['Invalid token.'] });
  }
  user.is_active = true;
  await user.save();
  let { password: _password, ...data } = user.toJSON();
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'User varified successfully.',
    data: data,
  });
}

async function login(req, res) {
  const user = await UserModel.findOne({ email: { $regex: `^${req.body.email}$`, $options: 'i' } }).populate('subscription.order');
  if (!user) {
    throw new NotFoundException('User not found.');
  }
  try {
    const varified = await user.comparePassword(req.body.password);
    if (varified) {
      if (user.is_active === false) {
        throw new UnauthorizedException('User is not varified.');
      }
      let { password: _password, ...data } = user.toJSON();
      const accounts = await AccountModel.count({ userId: user._id });
      return res.status(StatusCodes.OK).json({
        status: true,
        statusCode: StatusCodes.OK,
        message: 'User logged in successfully.',
        data: { user: { ...data, usage: { accounts } }, accessToken: await jwt.sign(data) },
      });
    }
  } catch (err) {
    console.log('============================================');
    console.log('[DEBUG] login::failed password varification', err.message || err.toString(), err.stack);
    console.log('============================================');
  }
  throw new UnauthorizedException('Invalid username and password.');
}

async function fbVerify(req, res) {
  let account;
  try {
    account = await fbService.verify(req.body.idToken);
  } catch (err) {
    console.log('============================================');
    console.log('[DEBUG] fbVerify::failed to fb verify token', err.message || err.toString(), err.stack);
    console.log('============================================');
    throw new UnauthorizedException('Invalid token.');
  }
  let user = await UserModel.findOne({ email: { $regex: `^${account.email}$`, $options: 'i' } }).populate('subscription.order');
  if (!user) {
    user = await UserModel.create({
      email: account.email.toLowerCase(),
      name: account.displayName,
      avatar: account.photoURL,
      is_active: true,
    });
  } else {
    user.is_active = true;
    await user.save();
  }
  let { password: _password, ...data } = user.toJSON();
  const accounts = await AccountModel.count({ userId: user._id });
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: { user: { ...data, usage: { accounts } }, accessToken: await jwt.sign(data) },
  });
}

async function profile(req, res) {
  const user = await UserModel.findOne({ _id: req.user._id }).populate('subscription.order');
  if (!user.is_active) {
    throw new UnauthorizedException("Account isn't varified, plz try again.");
  }
  let { password: _password, ...data } = user.toJSON();
  const accounts = await AccountModel.count({ userId: user._id });
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    data: { user: { ...data, usage: { accounts } }, accessToken: await jwt.sign(data) },
  });
}

async function forgotPassword(req, res) {
  const user = await UserModel.findOne({ email: { $regex: `^${req.body.email}$`, $options: 'i' } });
  if (!user) {
    throw new NotFoundException('User not found.');
  }
  const token = await jwt.sign({ id: user._id.toString() }, { expiresIn: '600000ms' });
  smtpService.newPasswordLink({ to: { name: user.name, email: user.email } }, { link: `${process.env.DOMAIN_URL}/SetANewPassword/${token}` });
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Password reset link sent successfully. Please check your email',
  });
}

async function updatePassword(req, res) {
  let user;
  try {
    const data = await jwt.verify(req.body.token);
    user = await UserModel.findOne({ _id: new mongoose.Types.ObjectId(data.id) }).populate('subscription.order');
  } catch (err) {
    throw new ValidationException('Invalid token.', { token: ['Invalid token.'] });
  }
  user.password = req.body.newPassword;
  await user.save();
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Password updated successfully.',
  });
}

async function resetPassword(req, res) {
  const user = await UserModel.findOne({ _id: req.user._id }).populate('subscription.order');
  let varified = false;
  try {
    if (await user.comparePassword(req.body.currentPassword)) {
      varified = true;
    }
  } catch {}
  if (!varified) {
    throw new ValidationException('Invalid current password.', { currentPassword: ['Invalid current password.'] });
  }
  user.password = req.body.newPassword;
  await user.save();
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Password updated successfully.',
  });
}

async function contactUs(req, res) {
  const contact = await ContactUsModel.create(req.body);
  // smtpService.contactUs({ to: { name: 'Admin', email: process.env.ADMIN_EMAIL } }, { user: contact });
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'We have notified the service provider. You will be contacted soon.',
  });
}

async function usage(req, res) {
  const endDate = dayjs();
  const startDate = endDate.add(-1, 'year');
  const logs = await LogModel.aggregate([
    { $match: { userId: req.user._id, created_at: { $gte: startDate.$d, $lte: endDate.$d }, type: LogType.Email } },
    {
      $lookup: {
        from: 'invoices',
        localField: 'invoiceId',
        foreignField: '_id',
        as: 'invoice',
      },
    },
    {
      $unwind: {
        path: '$invoice',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
        used_emails: { $sum: 1 },
        max_emails: {
          $sum: '$invoice.features.emails',
        },
        unlimited_emails: {
          $push: '$invoice.features.unlimited_emails',
        },
      },
    },
    {
      $project: {
        _id: 0,
        used_emails: 1,
        max_emails: 1,
        unlimited_emails: 1,
        date_range: '$_id',
      },
    },
  ]);
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    data: logs,
  });
}

module.exports = { register, verify, login, fbVerify, profile, forgotPassword, resetPassword, updatePassword, contactUs, usage };
