const express = require('express');
const router = express.Router();

const apiRoutes = require('./api');

router.use('/api', apiRoutes);
router.use('/webhook', require('./webhook'));

module.exports = router;
