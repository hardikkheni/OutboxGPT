const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const customers = {
  async create(options) {
    return await stripe.customers.create(options);
  },
};

const subscriptions = {
  async create(options) {
    return await stripe.subscriptions.create(options);
  },
  async retrieve(id) {
    return await stripe.subscriptions.retrieve(id);
  },
  async update(id, options) {
    return await stripe.subscriptions.update(id, options);
  },
};

const checkouts = {
  sessions: {
    async create(options) {
      return await stripe.checkout.sessions.create({
        ...options,
        mode: 'subscription',
        success_url: `${process.env.DOMAIN_URL}/payment?redirect_status=succeeded&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN_URL}/payment}?redirect_status=canceled`,
      });
    },
  },
};

const paymentIntents = {
  async retrieve(id) {
    return await stripe.paymentIntents.retrieve(id);
  },
};

const paymentMethods = {
  async retrieve(id) {
    return await stripe.paymentMethods.retrieve(id);
  },
};

module.exports = {
  customers,
  subscriptions,
  checkouts,
  paymentIntents,
  paymentMethods,
  webhooks: stripe.webhooks,
  stripe,
};
