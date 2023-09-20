const express = require('express');
const { StatusCodes } = require('http-status-codes');
const { validator, schema } = require('../../validation');
const asyncHandler = require('../../utils/helpers/async.helper');
const { accountController, authController, campaignController, orderController } = require('../../controllers');
const { authGuard, planGuard, quotaCheckGuard } = require('../../middlewares');
const { quotaCheck } = require('../../constants/plan.contant');

const router = express.Router();

router.get('/', (_req, res) => {
  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Welcome to the api.',
  });
});

/**
 * =======================================================
 * Auth routes
 * =======================================================
 */
router.post('/auth/register', validator(schema.auth.registerSchema), asyncHandler(authController.register));
router.post('/auth/verify', validator(schema.auth.verifySchema), asyncHandler(authController.verify));
router.post('/auth/login', validator(schema.auth.loginSchema), asyncHandler(authController.login));
router.post('/auth/fb-verify', validator(schema.auth.fbVerifySchema), asyncHandler(authController.fbVerify));
router.get('/auth/profile', authGuard, asyncHandler(authController.profile));
router.post('/auth/forgot-password', validator(schema.auth.forgotPasswordStep1Schema), asyncHandler(authController.forgotPassword));
router.post('/auth/set-new-password', validator(schema.auth.forgotPasswordStep2Schema), asyncHandler(authController.updatePassword));
router.post('/auth/reset-password', authGuard, validator(schema.auth.resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post('/auth/contact-us', validator(schema.auth.contactUsSchema), asyncHandler(authController.contactUs));
router.get('/auth/usage', authGuard, asyncHandler(authController.usage));
/**
 * =======================================================
 * Campaign routes
 * =======================================================
 */
router.get('/campaign', authGuard, asyncHandler(campaignController.list));
router.post(
  '/campaign',
  authGuard,
  planGuard,
  quotaCheckGuard(quotaCheck.CAMPAIGN),
  validator(schema.campaign.createSchema),
  asyncHandler(campaignController.create)
);

router.get('/campaign/:id', authGuard, asyncHandler(campaignController.findById));
router.post(
  '/campaign/draft',
  authGuard,
  planGuard,
  validator(schema.campaign.draftSchema),
  quotaCheckGuard(quotaCheck.EMAIL),
  asyncHandler(campaignController.createDraft)
);
router.post('/campaign/watch', authGuard, validator(schema.campaign.watchSchema), asyncHandler(campaignController.watchStatus));
router.delete('/campaign/:id', authGuard, planGuard, asyncHandler(campaignController.deleteById));

/**
 *
 * Account routes
 */
router.get('/account', authGuard, asyncHandler(accountController.list));
router.post(
  '/account',
  authGuard,
  planGuard,
  quotaCheckGuard(quotaCheck.ACCOUNT),
  validator(schema.account.createSchema),
  asyncHandler(accountController.create)
);
router.get('/account/ms/get-link', asyncHandler(accountController.getMsLink));
router.get('/account/ms/varify-code', asyncHandler(accountController.varifyMsCode));
router.get('/account/:id', authGuard, planGuard, asyncHandler(accountController.findById));
router.post('/account/:id', authGuard, validator(schema.account.updateSchema), asyncHandler(accountController.updateById));
// router.put('/account/:id', authGuard, validator(schema.account.updateSchema), asyncHandler(accountController.updateById));
router.delete('/account/:id', authGuard, asyncHandler(accountController.deleteById));

/**
 *
 * Order routes
 */
router.get('/plans', authGuard, asyncHandler(orderController.planList));
router.post('/order', authGuard, validator(schema.order.createSchema), asyncHandler(orderController.create));
router.get('/invoice', authGuard, asyncHandler(orderController.invoiceList));
router.get('/cards', authGuard, asyncHandler(orderController.cardList));

module.exports = router;
