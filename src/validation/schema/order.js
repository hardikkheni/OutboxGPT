const Yup = require('yup');

module.exports = {
  createSchema: Yup.object({
    planId: Yup.string().mongoId().required(),
    customer: Yup.object({
      name: Yup.string().required(),
      email: Yup.string().required().email(),
      address: Yup.object({
        city: Yup.string(),
        country: Yup.string(),
        line1: Yup.string(),
        line2: Yup.string().nullable(),
        postal_code: Yup.string(),
        state: Yup.string(),
      }),
      phone: Yup.string().nullable(),
    }),
  }),
  updateSchema: Yup.object({
    planId: Yup.string().mongoId().required(),
  }),
};
