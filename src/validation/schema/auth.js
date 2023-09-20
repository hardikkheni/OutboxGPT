const Yup = require('yup');

module.exports = {
  registerSchema: Yup.object({
    email: Yup.string().required().email(),
    name: Yup.string().required(),
    password: Yup.string().required().min(8).max(32),
  }),
  verifySchema: Yup.object({
    token: Yup.string().required(),
  }),
  loginSchema: Yup.object({
    email: Yup.string().required().email(),
    password: Yup.string().required().min(8).max(32),
  }),
  fbVerifySchema: Yup.object({
    idToken: Yup.string().required(),
  }),
  forgotPasswordStep1Schema: Yup.object({
    email: Yup.string().required().email(),
  }),
  forgotPasswordStep2Schema: Yup.object({
    token: Yup.string().required(),
    newPassword: Yup.string().required().min(8).max(32),
    confirmPassword: Yup.string()
      .required()
      .min(8)
      .max(32)
      .test('passwords-match', 'Passwords must match', function (value) {
        return this.parent.newPassword === value;
      }),
  }),
  resetPasswordSchema: Yup.object({
    currentPassword: Yup.string().required(),
    newPassword: Yup.string().required().min(8).max(32),
    confirmPassword: Yup.string()
      .required()
      .min(8)
      .max(32)
      .test('passwords-match', 'Passwords must match', function (value) {
        return this.parent.newPassword === value;
      }),
  }),
  contactUsSchema: Yup.object({
    name: Yup.string().required(),
    email: Yup.string().required().email(),
    message: Yup.string().required(),
    company_name: Yup.string().required(),
    phone: Yup.string().required(),
  }),
};
