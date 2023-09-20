const { CampaignStatus } = require('../constants/enum.constant');
const {
  makeResponseObj,
  _idProperty,
  exampleId,
  paginationParams,
  searchParam,
  makePaginatedObj,
  timestamps,
} = require('../utils/swagger');

const paths = {
  '/campaign': {
    get: {
      tags: ['Campaign'],
      summary: 'Get list of campaigns',
      parameters: [...paginationParams, searchParam],
      responses: {
        200: {
          description: 'Campaign list is fetched successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CampaignPaginatedResponse',
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Campaign'],
      summary: 'Create a new campaign',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewCampaignSchema',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Campaign is created successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CampaignResponse',
              },
            },
          },
        },
      },
    },
  },
  '/campaign/{id}': {
    get: {
      tags: ['Campaign'],
      summary: 'Get a campaign',
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The id of campaign',
          example: exampleId,
        },
      ],
      responses: {
        200: {
          description: 'Google User is varified successfully.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CampaignResponse',
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Campaign'],
      summary: 'Delete a campaign',
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'The id of campaign',
          example: exampleId,
        },
      ],
      responses: {
        200: {
          description: 'Campaign is deleted successfully.',
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
  NewCampaignSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name for campaign.',
        required: true,
      },
      fromId: {
        type: 'string',
        description: 'The id of the user who will be the sender for campaign.',
        example: exampleId,
        required: true,
      },
      subject: {
        type: 'string',
        description: 'The subject of email for campaign.',
        required: true,
      },
      body: {
        type: 'string',
        description: 'The body of email for campaign.',
        required: true,
      },
      recipients: {
        type: 'array',
        description: 'The list of recipients for campaign.',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of recipient.',
            },
            email: {
              type: 'string',
              description: 'The email of recipient.',
              required: true,
            },
          },
        },
      },
    },
  },
  CampaignModel: {
    type: 'object',
    properties: {
      ..._idProperty,
      name: {
        type: 'string',
        description: 'The name for campaign.',
        required: true,
      },
      fromId: {
        type: 'string',
        description: 'The id of the user who will be the sender or the campaign.',
        example: exampleId,
      },
      from: {
        $ref: '#/components/schemas/AccountModel',
      },
      status: {
        type: 'string',
        enum: Object.keys(CampaignStatus),
        example: CampaignStatus.Active,
        description: 'The status of for the campaign.',
      },
      subject: {
        type: 'string',
        description: 'The subject of email for the campaign.',
      },
      body: {
        type: 'string',
        description: 'The body of email for the campaign.',
      },
      userId: {
        type: 'string',
        description: 'The id of the user who created the campaign.',
        example: exampleId,
      },
      recipients: {
        type: 'array',
        description: 'The list of recipients for the campaign.',
        items: {
          $ref: '#/components/schemas/CampaignRecipientModel',
        },
      },
      ...timestamps,
    },
  },
  CampaignRecipientModel: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the recipient.',
        default: null,
      },
      email: {
        type: 'string',
        description: 'The name of the recipient.',
      },
      ...timestamps,
    },
  },
  ...makeResponseObj('Campaign', {
    $ref: '#/components/schemas/CampaignModel',
  }),
  ...makeResponseObj(
    'CampaignPaginated',
    makePaginatedObj({
      type: 'array',
      items: {
        $ref: '#/components/schemas/CampaignModel',
      },
    })
  ),
};

module.exports = { paths, schemas };
