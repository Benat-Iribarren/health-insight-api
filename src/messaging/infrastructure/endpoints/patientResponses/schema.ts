import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const responseItem = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'patientId', 'subject', 'messageId', 'isRead', 'createdAt', 'message'],
    properties: {
        id: { type: 'string' },
        patientId: { type: 'number' },
        subject: { type: 'string' },
        messageId: { type: 'string' },
        isRead: { type: 'boolean' },
        createdAt: { type: 'string' },
        message: { type: 'string' },
    },
};

export const getResponsesSchema = {
    schema: {
        response: {
            200: { type: 'array', items: responseItem },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};

export const markResponseAsReadSchema = {
    schema: {
        params: {
            type: 'object',
            additionalProperties: false,
            required: ['responseId'],
            properties: { responseId: { type: 'string' } },
        },
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
        params: {
            type: 'object',
            additionalProperties: false,
            required: ['responseId'],
            properties: { responseId: { type: 'string' } },
        },
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