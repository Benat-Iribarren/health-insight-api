import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const presenceMinuteSchema = {
    schema: {
        body: {
            type: 'object',
            additionalProperties: false,
            properties: {
                minuteTsUtc: { type: 'string' },
                contextType: { type: 'string', enum: ['dashboard', 'session'] },
                sessionId: { type: ['number', 'null'] },
            },
            required: ['contextType'],
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    action: { type: 'string' },
                    intervalId: { type: 'number' },
                    message: { type: 'string' },
                },
                required: ['action', 'intervalId', 'message'],
            },
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};