const express = require('express');
const v1Routes = require('./v1');
const { StatusCodes } = require('http-status-codes');

const router = express.Router();
router.use(express.json({}));
router.use(express.urlencoded({ extended: true }));
router.use('/v1', v1Routes);

router.use((err, _req, res, _next) => {
  if (res.headersSent) return;
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const hasErrors = err.errors && Object.keys(err.errors).length > 0;
  res.status(statusCode).json({
    status: false,
    statusCode,
    message: err.message || err.toString(),
    ...(hasErrors ? { errors: err.errors } : {}),
  });
});

module.exports = router;
