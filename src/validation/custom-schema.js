const { isValidObjectId } = require('mongoose');
const Yup = require('yup');

Yup.addMethod(Yup.string, 'mongoId', function (message = '${path} must be a valid mongo id') {
  return this.test('mongoId', message, function (value) {
    if (!value) return false;
    return isValidObjectId(value);
  });
});
