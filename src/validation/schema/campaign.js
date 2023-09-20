require('../custom-schema');
const Yup = require('yup');

module.exports = {
  createSchema: Yup.object({
    fromId: Yup.string().mongoId().required(),
    name: Yup.string().required(),
    subject: Yup.string().required(),
    body: Yup.string().required(),
    recipients: Yup.array()
      .of(
        Yup.object({
          name: Yup.string().nullable(),
          email: Yup.string().required().email(),
        })
      )
      .required()
      .min(1),
  }),
  draftSchema: Yup.object({
    recipientId: Yup.string().mongoId().required(),
  }),
  watchSchema: Yup.object({
    campaignId: Yup.string().mongoId().required(),
    recipientIds: Yup.array().of(Yup.string().mongoId().required()),
  }),
};
