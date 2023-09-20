const { set } = require('lodash');
const asyncHandler = require('../utils/helpers/async.helper');
const { ValidationException } = require('../utils/exceptions');

function validator(schema, options = { abortEarly: false, stripUnknown: true }) {
  return asyncHandler(async function (req, _res, _next) {
    try {
      const obj = await schema.validate(req.body, options);
      req.body = obj;
    } catch (err) {
      let errors;
      if (err.inner.length > 1) {
        errors = err.inner.reduce(
          (acc, e) => {
            set(acc, e.path, e.errors);
            return acc;
          },
          schema.type === 'array' ? [] : {}
        );
      } else {
        errors = err.inner?.[0]?.errors;
      }
      throw new ValidationException('Validation failed!.', errors);
    }
  });
}

module.exports = validator;
