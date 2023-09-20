const { ProviderType } = require('../constants/enum.constant');
const { _idProperty, timestamps, paginationParams, searchParam, makeResponseObj, makePaginatedObj } = require('../utils/swagger');

const paths = {
  '/account': {
    get: {
      tags: ['Account'],
      summary: 'Get list of accounts',
      parameters: [...paginationParams, searchParam],
      responses: {
        200: {
          description: 'Account list is fetched successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AccountPaginatedResponse',
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Account'],
      summary: 'Create a new account',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewAccountSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Account is created successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AccountResponse',
              },
            },
          },
        },
      },
    },
  },
  '/account/{id}': {
    get: {
      tags: ['Account'],
      summary: 'Get an account by id',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Account id',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        200: {
          description: 'Account is fetched successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AccountResponse',
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Account'],
      summary: 'Delete an account by id',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Account id',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        200: {
          description: 'Account is deleted successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse',
              },
            },
          },
        },
      },
    },
    put: {
      tags: ['Account'],
      summary: 'Update an account by id',
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'Account id',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateAccountSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Account is updated successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AccountResponse',
              },
            },
          },
        },
      },
    },
  },
};
const schemas = {
  NewAccountSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the sender.',
        required: true,
      },
      email: {
        type: 'string',
        required: true,
        description: 'The email of the sender.',
      },
    },
  },
  UpdateAccountSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the sender.',
        required: true,
      },
      email: {
        type: 'string',
        required: true,
        description: 'The email of the sender.',
      },
    },
  },
  AccountModel: {
    type: 'object',
    properties: {
      ..._idProperty,
      name: {
        type: 'string',
        description: 'The name of the sender.',
      },
      email: {
        type: 'string',
        required: true,
        description: 'The email of the sender.',
      },
      provider: {
        type: 'string',
        required: true,
        description: 'The provider of the sender.',
        enum: Object.values(ProviderType),
      },
      ...timestamps,
    },
  },
  ...makeResponseObj('Account', {
    $ref: '#/components/schemas/AccountModel',
  }),
  ...makeResponseObj(
    'AccountPaginated',
    makePaginatedObj({
      type: 'array',
      items: {
        $ref: '#/components/schemas/AccountModel',
      },
    })
  ),
};

module.exports = { paths, schemas };
