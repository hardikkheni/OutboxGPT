function makeResponseObj(name, obj = null) {
  return {
    [`${name}Response`]: {
      type: 'object',
      properties: {
        ...(obj
          ? {
              data: obj,
            }
          : {}),
        statusCode: { type: 'integer', description: 'The Error code at time of method execution.', example: 200 },
        status: {
          type: 'boolean',
          description: 'Based on if the method is executed successfully or not.',
          example: true,
        },
        message: { type: 'string', description: 'The message of method response.' },
      },
    },
  };
}

function makePaginatedObj(obj) {
  return {
    type: 'object',
    required: true,
    properties: {
      data: obj,
      total: {
        type: 'integer',
        description: 'Total number of records',
        required: true,
        example: 10,
      },
    },
  };
}

const exampleId = '64733473f479e8815c5f9571';
const _idProperty = { _id: { type: 'string', required: true, example: exampleId } };
const paginationParams = [
  { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
  { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
];
const searchParam = { in: 'query', name: 'search', schema: { type: 'string' } };

const timestamps = {
  created_at: { type: 'string', format: 'date-time', description: 'The date-time when the record was created.' },
  updated_at: { type: 'string', format: 'date-time', description: 'The date-time when the record was updated.' },
};

module.exports = {
  makeResponseObj,
  exampleId,
  _idProperty,
  paginationParams,
  searchParam,
  makePaginatedObj,
  timestamps,
};
