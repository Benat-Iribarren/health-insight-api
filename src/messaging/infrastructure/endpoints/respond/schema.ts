import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const respondSchema = {
    schema: {
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['messageId', 'subject'],
            properties: {
                messageId: { type: 'string' },
                subject: { type: 'string' },
            },
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