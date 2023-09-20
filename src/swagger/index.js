const { StatusCodes } = require('http-status-codes');
const authDoc = require('./auth');
const campaignDoc = require('./campaign');
const accountDoc = require('./account');
const orderDoc = require('./order');

module.exports = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Ai Email Writter api',
      description: 'Ai Email Writter Application API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/{version}',
        description: 'The local development server',
        variables: {
          version: {
            enum: ['v1'],
            default: 'v1',
          },
        },
      },
    ],
    security: [
      {
        Bearer: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'To manage Authentication & Authorization',
      },
      {
        name: 'Campaign',
        description: 'To manage Campaign',
      },
      {
        name: 'Account',
        description: 'To manage Account',
      },
      {
        name: 'Subscription',
        description: 'To manage Subscription',
      },
    ],
    paths: {
      ...authDoc.paths,
      ...campaignDoc.paths,
      ...accountDoc.paths,
      ...orderDoc.paths,
    },
    components: {
      securitySchemes: {
        Bearer: {
          type: 'http',
          description: 'Enter JWT Bearer token **_only_**',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              description: 'The code at time of method execution.',
              example: StatusCodes.OK,
            },
            status: {
              type: 'boolean',
              description: 'Based on if the method is executed successfully or not.',
              example: true,
            },
            message: { type: 'string', description: 'The message of method response.' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', description: 'The Error code at time of method execution.' },
            status: { type: 'boolean', description: 'Based on if the method is executed successfully or not.' },
            message: { type: 'string', description: 'The message of method response.' },
            errors: { type: 'object', description: 'The schema validation response.' },
          },
        },
        ...authDoc.schemas,
        ...campaignDoc.schemas,
        ...accountDoc.schemas,
        ...orderDoc.schemas,
      },
    },
    consumes: ['application/json'],
    produces: ['application/json'],
  },
  apis: [],
};
