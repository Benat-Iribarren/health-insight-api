import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const presenceMinuteSchema = {
    schema: {
        body: {
            type: 'object',
            properties: {
                minuteTsUtc: { type: 'string' },
                contextType: { type: 'string', enum: ['dashboard', 'session'] },
                sessionId: { type: ['string', 'null'] },
            },
            required: ['contextType'],
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    action: { type: 'string' },
                    intervalId: { type: 'string' },
                    message: { type: 'string' },
                },
                required: ['status', 'action', 'intervalId', 'message'],
            },
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};
