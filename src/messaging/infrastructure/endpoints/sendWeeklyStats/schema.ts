import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';
export const sendWeeklyStatsSchema = {
    schema: {
        body: false,
        headers: {
            type: 'object',
            properties: {
                'x-health-insight-cron': { type: 'string' },
            },
            additionalProperties: true,
        },
        params: {
            type: 'object',
            properties: {
                patientId: { type: 'string' },
            },
            required: [],
            additionalProperties: false,
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            processedCount: { type: 'integer' },
                            sentAt: { type: 'string', format: 'date-time' },
                        },
                        required: ['processedCount', 'sentAt'],
                    },
                },
                required: ['message', 'data'],
            },
            202: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            sentAt: { type: 'string' },
                        },
                        required: ['sentAt'],
                    },
                },
                required: ['message', 'data'],
            },
            400: errorSchema,
            403: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};
