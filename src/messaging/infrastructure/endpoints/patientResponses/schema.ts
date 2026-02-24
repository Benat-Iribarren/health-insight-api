import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const responseIdParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['responseId'],
    properties: {
        responseId: { type: 'string', minLength: 1 },
    },
};

const responseItemSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'patient_id', 'subject', 'message_id', 'is_read', 'created_at'],
    properties: {
        id: { type: 'string' },
        patient_id: { type: 'number' },
        subject: { type: 'string' },
        message_id: { type: 'string' },
        is_read: { type: 'boolean' },
        created_at: { type: 'string' },
    },
};

export const getResponsesSchema = {
    schema: {
        response: {
            200: {
                type: 'array',
                items: responseItemSchema,
            },
            401: errorSchema,
            500: errorSchema,
        },
    },
};
export const markResponseAsReadSchema = {
    schema: {
        params: responseIdParamsSchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['message'],
                properties: { message: { type: 'string' } },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};

export const deleteResponseSchema = {
    schema: {
        params: responseIdParamsSchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['message'],
                properties: { message: { type: 'string' } },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};