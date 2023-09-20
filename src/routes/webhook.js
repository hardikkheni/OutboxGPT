const express = require('express');
const { orderController } = require('../controllers');
const asyncHelper = require('../utils/helpers/async.helper');
const router = express.Router();

router.post('/v1/stripe', express.raw({ type: 'application/json' }), asyncHelper(orderController.stripeHook));

module.exports = router;
