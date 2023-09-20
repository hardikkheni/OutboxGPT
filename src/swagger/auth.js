const { PlanStatus } = require('../constants/enum.constant');
const { makeResponseObj, _idProperty, exampleId } = require('../utils/swagger');

const paths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register new user',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewUserSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'New User is registered successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserResponse',
              },
            },
          },
        },
      },
    },
  },
  '/auth/varify': {
    post: {
      tags: ['Auth'],
      summary: 'Varify new user',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VarifyNewUserSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'User is logged in successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserResponse',
              },
            },
          },
        },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'User Login',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'New User is varified successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoggedInUserResponse',
              },
            },
          },
        },
      },
    },
  },
  '/auth/fb-varify': {
    post: {
      tags: ['Auth'],
      summary: 'Verify firebase/google user',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GoogleUserSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Google User is varified successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoggedInUserResponse',
              },
            },
          },
        },
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Get link to set a new password',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  required: true,
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Get link to set a new password.',
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
  },
  '/auth/set-new-password': {
    post: {
      tags: ['Auth'],
      summary: 'Set a new password',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SetNewPasswordSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Password is reset successfully.',
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
  },
  '/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResetPasswordSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Password is reset successfully.',
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
  },
};

const schemas = {
  SetNewPasswordSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        required: true,
        example: 'askldlkajshdjlajskdjaklsjdklajskdjasd',
        description: 'Token received in email',
      },
      newPassword: {
        type: 'string',
        required: true,
        example: '********',
      },
      confirmPassword: {
        type: 'string',
        required: true,
        example: '********',
      },
    },
  },
  ResetPasswordSchema: {
    type: 'object',
    properties: {
      currentPassword: {
        type: 'string',
        required: true,
        example: '********',
      },
      newPassword: {
        type: 'string',
        required: true,
        example: '********',
      },
      confirmPassword: {
        type: 'string',
        required: true,
        example: '********',
      },
    },
  },
  VarifyNewUserSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        required: true,
        example: 'example.google.com',
      },
      code: {
        type: 'string',
        required: true,
        example: '123456',
      },
    },
  },
  LoginSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        required: true,
        example: 'example.google.com',
      },
      password: {
        type: 'string',
        required: true,
        example: '123456',
      },
    },
  },
  NewUserSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        required: true,
        example: 'example.google.com',
      },
      name: {
        type: 'string',
        required: true,
        example: 'example name',
      },
      password: {
        type: 'string',
        required: true,
        example: '********',
      },
    },
  },
  GoogleUserSchema: {
    type: 'object',
    properties: {
      idToken: { type: 'string', required: true, example: '123456', description: 'Google id token' },
    },
  },
  UserModel: {
    type: 'object',
    properties: {
      ..._idProperty,
      name: { type: 'string', required: true },
      email: { type: 'string', required: true },
      is_active: { type: 'boolean', default: false, example: true },
      avatar: { type: 'string' },
      customerId: { type: 'string', description: 'The customer id of the user subscription.' },
      subscription: {
        type: 'object',
        properties: {
          orderId: { type: 'string', example: exampleId, default: null },
          order: {
            nullable: true,
            anyOf: [
              {
                $ref: '#/components/schemas/OrderModel',
              },
            ],
          },
          status: { type: 'string', example: PlanStatus.Active, default: PlanStatus.Active, enum: Object.values(PlanStatus) },
          quota: {
            $ref: '#/components/schemas/FeatureSchema',
          },
        },
      },
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
    },
  },
  ...makeResponseObj('User', {
    $ref: '#/components/schemas/UserModel',
  }),
  ...makeResponseObj('LoggedInUser', {
    type: 'object',
    properties: {
      user: {
        $ref: '#/components/schemas/UserModel',
      },
      accessToken: { type: 'string', description: 'The access token for the user.' },
    },
  }),
};

module.exports = { paths, schemas };
