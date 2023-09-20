const { PlanInterval, PlanType, PaymentStatus } = require('../constants/enum.constant');
const { _idProperty, exampleId, makeResponseObj } = require('../utils/swagger');

const paths = {
  '/order': {
    post: {
      tags: ['Subscription'],
      summary: 'Create a new order',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewOrderSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The order was successfully created.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderResponse',
              },
            },
          },
        },
      },
    },
  },
};
const schemas = {
  NewOrderSchema: {
    type: 'object',
    properties: {
      planId: {
        type: 'string',
        description: 'The plan id of the order.',
        required: true,
        example: exampleId,
      },
    },
  },
  OrderModel: {
    type: 'object',
    properties: {
      ..._idProperty,
      name: { type: 'string', required: true },
      subscriptionId: { type: 'string', description: 'The subsciption id of stripe', required: true },
      productId: { type: 'string', required: true },
      priceId: { type: 'string', required: true },
      price: { type: Number, required: true },
      type: {
        type: 'string',
        required: true,
        enum: Object.values(PlanType),
        default: PlanType.OneTime,
      },
      recurring: {
        type: 'object',
        properties: {
          interval: { type: 'string', required: true, enum: Object.values(PlanInterval), example: PlanInterval.Month },
          interval_count: { type: Number, required: true, example: 1 },
        },
        default: null,
      },
      features: {
        $ref: '#/components/schemas/FeatureSchema',
      },
      status: {
        type: 'string',
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.Pending,
      },
      active: {
        type: 'boolean',
        default: false,
      },
      lastActivedAt: {
        type: 'string',
        example: '2021-01-01T00:00:00.000Z',
        default: null,
      },
    },
  },
  ...makeResponseObj('Order', {
    type: 'object',
    properties: {
      subscriptionId: {
        type: 'string',
        description: 'The subscription id of the order.',
      },
      clientSecret: {
        type: 'string',
        description: 'The clinet secret of the order subscription.',
      },
    },
  }),
  FeatureSchema: {
    type: 'object',
    properties: {
      accounts: { type: 'integer', required: true, default: 0 },
      emails: { type: 'integer', required: true, default: 0 },
      history: { type: 'boolean', required: true, default: false },
      campaign: { type: 'boolean', required: true, default: false },
      integrations: { type: 'integer', required: true, default: 0 },
    },
  },
};

module.exports = {
  paths,
  schemas,
};
