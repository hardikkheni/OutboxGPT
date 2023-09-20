const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { timestamps, defaultOptions, freePlanQuota } = require('../../constants/db.constant');
const { FeatureSchema, AddressSchema } = require('../schemas');
const { PlanStatus } = require('../../constants/enum.constant');

const SALT_WORK_FACTOR = 10;

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    is_active: { type: Boolean, default: false },
    password: { type: String },
    customerId: { type: String, description: 'The customer id of the user subscription.' },
    address: {
      type: AddressSchema,
      default: null,
    },
    avatar: { type: String },
    subscription: {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
      },
      status: {
        type: String,
        enum: Object.values(PlanStatus),
        default: PlanStatus.Active,
      },
      quota: {
        type: FeatureSchema,
        default: freePlanQuota,
      },
    },
  },
  {
    virtuals: {
      'subscription.order': {
        options: {
          ref: 'Order',
          localField: 'subscription.orderId',
          foreignField: '_id',
          justOne: true,
        },
      },
    },
    ...defaultOptions,
    timestamps,
  }
);

UserSchema.pre('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return new Promise((res, rej) => {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
      if (err) return rej(err);
      res(isMatch);
    });
  });
};

const User = mongoose.model('User', UserSchema);

// User.prototype.accountAdded = async function (num = 1) {
//   return await User.findOneAndUpdate(
//     {
//       _id: this._id,
//       'subscription.quota.unlimited_accounts': false,
//     },
//     {
//       $inc: {
//         'subscription.quota.accounts': -1 * num,
//       },
//     },
//     {
//       new: true,
//     }
//   );
// };

User.prototype.campaignAdded = async function (num = 1) {
  return await User.findOneAndUpdate(
    {
      _id: this._id,
      'subscription.quota.unlimited_campaigns': false,
    },
    {
      $inc: {
        'subscription.quota.campaigns': -1 * num,
      },
    },
    {
      new: true,
    }
  );
};

User.prototype.emailAdded = async function (num = 1) {
  return await User.findOneAndUpdate(
    {
      _id: this._id,
      'subscription.quota.unlimited_emails': false,
    },
    {
      $inc: {
        'subscription.quota.emails': -1 * num,
      },
    },
    {
      new: true,
    }
  );
};

module.exports = User;
