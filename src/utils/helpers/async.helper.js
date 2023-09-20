module.exports = function asyncHandler(fn) {
  return async function (req, res, next) {
    try {
      await fn(req, res, next);
      next();
    } catch (err) {
      console.log(err);
      next(err);
    }
  };
};
