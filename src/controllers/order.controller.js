const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const { UserModel, PlanModel, OrderModel, InvoiceModel, CardModel } = require('../db/models');
const stripeService = require('../services/stripe.service');
const agendService = require('../services/agenda.service');
const { NotFoundException, BadRequestException } = require('../utils/exceptions');
const { PaymentStatus, PlanStatus, InvoiceStatus, PlanInterval } = require('../constants/enum.constant');
const { emptyPlanQuota } = require('../constants/db.constant');
const jobConstants = require('../constants/job.constant');

async function create(req, res) {
  const user = req.user;
  let subscription;
  const { customer: cust } = req.body;
  const plan = await PlanModel.findOne({ _id: new mongoose.Types.ObjectId(req.body.planId) });
  if (!plan) throw new NotFoundException('Plan not found.');

  if (!user.customerId) {
    try {
      const customer = await stripeService.customers.create(cust);
      user.customerId = customer.id;
      user.address = cust.address;
      await user.save();
    } catch (err) {
      throw new BadRequestException('Failed to create customer.');
    }
  }

  try {
    if (user.subscription.order) {
      subscription = await stripeService.subscriptions.retrieve(user.subscription.order.subscriptionId);
      subscription = await stripeService.subscriptions.update(user.subscription.order.subscriptionId, {
        cancel_at_period_end: false,
        items: [{ id: subscription.items.data[0].id, price: plan.priceId }],
        proration_behavior: 'always_invoice',
        expand: ['latest_invoice.payment_intent'],
      });
      const order = await OrderModel.findOne({ _id: user.subscription.orderId });
      order.planId = plan._id;
      order.features = plan.features;
      order.name = plan.name;
      order.productId = plan.productId;
      order.priceId = plan.priceId;
      order.price = plan.price;
      order.recurring = plan.recurring;
      order.type = plan.type;
      await order.save();
    } else {
      subscription = await stripeService.subscriptions.create({
        customer: user.customerId,
        items: [{ price: plan.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription', payment_method_types: ['card'] },
        expand: ['latest_invoice.payment_intent'],
      });
      await OrderModel.create({
        userId: user._id,
        subscriptionId: subscription.id,
        planId: plan._id,
        status: PaymentStatus.Pending,
        features: plan.features,
        name: plan.name,
        productId: plan.productId,
        priceId: plan.priceId,
        price: plan.price,
        recurring: plan.recurring,
        type: plan.type,
      });
    }
  } catch (err) {
    console.log('============================================');
    console.log('err', err);
    console.log('============================================');
    throw new BadRequestException('Failed to create subscription.');
  }

  try {
    return res.status(StatusCodes.OK).json({
      status: true,
      statusCode: StatusCodes.OK,
      message: 'Ordered successfully.',
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent?.client_secret,
        paid: subscription.latest_invoice.paid,
      },
    });
  } catch (err) {
    console.log('============================================');
    console.log('err', err);
    console.log('============================================');
    throw new Error('Failed to create order');
  }
}

async function stripeHook(req, res) {
  const sig = req.headers['stripe-signature'];
  let order, user, invoice, payIntent, payMethod, newQuota;
  let event;
  try {
    event = stripeService.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new BadRequestException(`Webhook Error: ${err.message}`);
  }
  const data = event.data.object;
  console.log('============================================');
  console.log('event.type', event.type, data.id, data.subscription);
  console.log('============================================');
  switch (event.type) {
    case 'customer.subscription.created':
      // let oldOrder;
      order = await OrderModel.findOne({ subscriptionId: data.id }).sort({ created_at: -1 });
      user = await UserModel.findOne({ _id: order.userId });
      // if (user && user.subscription.orderId) {
      //   oldOrder = await OrderModel.findOne({ _id: user.subscription.orderId });
      // }

      // if (oldOrder) {
      //   oldOrder.status = PaymentStatus.Cancelled;
      //   await oldOrder.save();
      // }

      order.status = PaymentStatus.Pending;
      await order.save();

      // const userQuota = user.subscription.quota;
      // const oldQuota = oldOrder?.features;
      newQuota = order.features;

      // update subscription status
      user.subscription.status = PlanStatus.Expired;
      user.subscription.orderId = order._id;

      // const usedAccounts = (oldQuota?.accounts || 0) - (userQuota?.accounts > 0 ? userQuota?.accounts : 0);
      // const usedEmails = (oldQuota?.emails || 0) - (userQuota?.emails > 0 ? userQuota?.emails : 0);
      // const usedIntegrations = (oldQuota?.integrations || 0) - (userQuota?.integrations > 0 ? userQuota?.integrations : 0);
      // const usedCampaigns = (oldQuota?.campaigns || 0) - (userQuota?.campaigns > 0 ? userQuota?.campaigns : 0);

      // user.subscription.quota = {
      //   accounts: newQuota.accounts - (usedAccounts > 0 ? (usedAccounts <= newQuota.accounts ? usedAccounts : newQuota.accounts) : 0),
      //   unlimited_accounts: newQuota.unlimited_accounts,
      //   emails: newQuota.emails - (usedEmails > 0 ? (usedEmails <= newQuota.emails ? usedEmails : newQuota.emails) : 0),
      //   unlimited_emails: newQuota.unlimited_emails,
      //   integrations:
      //     newQuota.integrations - (usedIntegrations > 0 ? (usedIntegrations <= newQuota.integrations ? usedIntegrations : newQuota.integrations) : 0),
      //   unlimited_integrations: newQuota.unlimited_integrations,
      //   campaigns: newQuota.campaigns - (usedCampaigns > 0 ? (usedCampaigns <= newQuota.campaigns ? usedCampaigns : newQuota.campaigns) : 0),
      //   unlimited_campaigns: newQuota.unlimited_integrations,
      //   history: newQuota.history,
      // };
      user.subscription.quota = newQuota;
      await user.save();
      break;

    case 'customer.subscription.updated':
      order = await OrderModel.findOne({ subscriptionId: data.id }).sort({ created_at: -1 });
      user = await UserModel.findOne({ _id: order.userId });
      newQuota = order.features;
      user.subscription.quota = newQuota;
      user.subscription.orderId = order._id;
      await user.save();
      break;

    case 'invoice.paid':
      order = await OrderModel.findOne({ subscriptionId: data.subscription }).sort({ created_at: -1 });
      user = await UserModel.findOne({ _id: order.userId });

      // activate subscription
      user.subscription.status = PlanStatus.Active;
      await user.save();

      // set last activation date subscription
      order.lastActivedAt = new Date();
      await order.save();

      // schedule next quota refill
      if (order.recurring.interval === PlanInterval.Year) {
        agendService.schedule('in 1 month', jobConstants.stripeJobs.RESTORE_MONTHLY_QOUTA, { userId: user._id.toString() });
      }

      invoice = await InvoiceModel.findOne({ invoiceId: data.id });
      invoice.status = InvoiceStatus.Paid;
      await invoice.save();
      if (data.payment_intent) {
        payIntent = await stripeService.paymentIntents.retrieve(data.payment_intent);
        payMethod = await stripeService.paymentMethods.retrieve(payIntent.payment_method);
        await CardModel.findOneAndUpdate(
          {
            payId: payMethod.id,
            userId: user._id,
          },
          {
            last4: payMethod.card.last4,
            brand: payMethod.card.brand,
            exp: {
              month: payMethod.card.exp_month,
              year: payMethod.card.exp_year,
            },
          },
          {
            upsert: true,
            new: true,
          }
        );
      }

      break;

    case 'invoice.payment_failed':
      // If the payment fails or the customer does not have a valid payment method,
      //  an invoice.payment_failed event is sent, the subscription becomes past_due.
      // Use this webhook to notify your user that their payment has
      // failed and to retrieve new card details.
      order = await OrderModel.findOne({ subscriptionId: data.subscription }).sort({ created_at: -1 });
      user = await UserModel.findOne({ _id: order.userId });

      user.subscription.status = PlanStatus.Expired;
      await user.save();
      break;
    case 'invoice.finalized':
      order = await OrderModel.findOne({ subscriptionId: data.subscription }).sort({ created_at: -1 });
      if (order) {
        user = await UserModel.findOne({ _id: order.userId });
        // If you want to manually send out invoices to your customers
        // or store them locally to reference to avoid hitting Stripe rate limits.
        await InvoiceModel.findOneAndUpdate(
          {
            invoiceId: data.id,
            userId: user._id,
          },
          {
            subscriptionId: data.subscription,
            amount: data.total / 100,
            userId: user._id,
            links: {
              pdf: data.invoice_pdf,
              view: data.hosted_invoice_url,
            },
            features: order.features,
          },
          {
            upsert: true,
          }
        );
      }

      break;
    case 'customer.subscription.deleted':
      if (event.request != null) {
        // handle a subscription cancelled by your request
        // from above.
      } else {
        // handle subscription cancelled automatically based
        // upon your subscription settings.
      }
      order = await OrderModel.findOne({ subscriptionId: data.id }).sort({ created_at: -1 });
      user = await UserModel.findOne({ _id: order.userId });
      user.subscription.status = PlanStatus.Active;
      user.subscription.orderId = null;
      user.subscription.quota = emptyPlanQuota;
      await user.save();
      order.status = PaymentStatus.Cancelled;
      await order.save();
      break;
  }
  res.status(StatusCodes.OK).json({ success: true });
}

async function planList(req, res) {
  const plans = await PlanModel.find({ active: true });

  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Plans fetched successfully.',
    data: plans,
  });
}

async function invoiceList(req, res) {
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 10);
  const skip = (page - 1) * limit;
  const query = [
    {
      $match: { userId: req.user._id },
    },
  ];
  const total = await InvoiceModel.aggregate([...query, { $count: 'total' }]);
  const invoices = await InvoiceModel.aggregate([...query])
    .skip(skip)
    .limit(limit);

  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Invoices fetched successfully.',
    data: { data: invoices, total: total?.[0]?.total || 0 },
  });
}

async function cardList(req, res) {
  const query = [
    {
      $match: { userId: req.user._id },
    },
  ];
  const cards = await CardModel.aggregate([...query]);

  return res.status(StatusCodes.OK).json({
    status: true,
    statusCode: StatusCodes.OK,
    message: 'Cards fetched successfully.',
    data: cards,
  });
}

module.exports = { create, stripeHook, planList, invoiceList, cardList };
