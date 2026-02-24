import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const respondSchema = {
    schema: {
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['subject', 'messageId'],
            properties: {
                subject: { type: 'string', minLength: 1 },
                messageId: { type: 'string', minLength: 1 },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['message', 'data'],
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['messageId', 'createdAt'],
                        properties: {
                            messageId: { type: 'string' },
                            createdAt: { type: 'string' },
                        },
                    },
                },
            },
            400: errorSchema,
            404: errorSchema,
            401: errorSchema,
            500: errorSchema,
        },
    },
};