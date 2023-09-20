const Yup = require('yup');
const { ProviderType } = require('../../constants/enum.constant');

module.exports = {
  createSchema: Yup.object({
    code: Yup.string().required(),
    provider: Yup.string().required().oneOf(Object.values(ProviderType)),
  }),
  updateSchema: Yup.object({
    signature: Yup.string(),
  }),
};
