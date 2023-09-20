const path = require('path');
require('dotenv').config({
  path: path.resolve(process.cwd(), `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`),
});
const { connect } = require('../db');
const { PlanModel } = require('../db/models');
const { stripe } = require('../services/stripe.service');
const { PlanType } = require('../constants/enum.constant');

// make it usd in production or varified stripe account
const currency = 'inr';

async function run() {
  await connect();

  const products = [
    {
      name: 'Tier 1',
      plans: [
        {
          name: 'Monthly',
          amount: 49,
          interval: 'month',
          features: {
            accounts: 1,
            unlimited_accounts: false,
            emails: 10,
            unlimited_emails: false,
            history: false,
            campaigns: 1,
            unlimited_campaigns: false,
            integrations: 1,
            unlimited_integrations: false,
          },
          details: [
            '10 emails Recipients/ per month',
            'No access to history',
            'Only 1 email account',
            'Generate mailto link (no integration with gmail or outlook)',
          ],
        },
      ],
    },
    {
      name: 'Tier 2',
      plans: [
        {
          name: 'Monthly',
          amount: 149,
          interval: 'month',
          features: {
            accounts: 2,
            unlimited_accounts: false,
            emails: 100,
            unlimited_emails: false,
            history: true,
            campaigns: 0,
            unlimited_campaigns: true,
            integrations: 2,
            unlimited_integrations: false,
          },
          details: [
            '100 emails generated/sent per month',
            'Access to history',
            'Access to campaign',
            'Up to 2 email address for sender',
            'Integration with 2 email provider (gmail or outlook or else?)',
          ],
        },
      ],
    },
    {
      name: 'Tier 3',
      plans: [
        {
          name: 'Monthly',
          amount: 449,
          interval: 'month',
          features: {
            accounts: 5,
            unlimited_accounts: false,
            emails: 1000,
            unlimited_emails: false,
            history: true,
            campaigns: 0,
            unlimited_campaigns: true,
            integrations: 2,
            unlimited_integrations: false,
          },
          details: [
            '1000 emails generated/sent per month',
            'Access to history',
            'Access to campaign',
            'Up to 5 email address for sender',
            'Integration with 2 email provider (gmail or outlook or else?)',
          ],
        },
      ],
    },
    {
      name: 'Tier 4',
      plans: [
        {
          name: 'Monthly',
          amount: 799,
          interval: 'month',
          features: {
            accounts: 0,
            unlimited_accounts: true,
            emails: 0,
            unlimited_emails: true,
            history: true,
            campaigns: 0,
            unlimited_campaigns: true,
            integrations: 2,
            unlimited_integrations: false,
          },
          details: ['unlimited emails generated/sent per month', 'unlimited email addresses for the sender'],
        },
      ],
    },
  ];

  await PlanModel.deleteMany({});

  for (const product of products) {
    const sProduct = await stripe.products.create({
      name: product.name,
    });
    for (const plan of product.plans) {
      const sPlan = await stripe.prices.create({
        unit_amount: plan.amount * 100,
        currency,
        recurring: { interval: plan.interval },
        product: sProduct.id,
      });
      await PlanModel.create({
        name: product.name,
        productId: sProduct.id,
        priceId: sPlan.id,
        price: plan.amount,
        recurring: {
          interval: plan.interval,
        },
        type: PlanType.Recurring,
        features: plan.features,
        active: true,
        details: plan.details,
      });
    }
  }

  process.exit(0);
}

run();
