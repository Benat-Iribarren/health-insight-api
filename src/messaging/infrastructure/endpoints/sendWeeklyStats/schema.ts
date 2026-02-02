import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const sendWeeklyStatsSchema = {
    schema: {
        headers: {
            type: 'object',
            properties: {
                'x-health-insight-cron': { type: 'string' }
            }
        },
        params: {
            type: 'object',
            properties: { patientId: { type: 'string' } }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            processedRecipients: { type: 'number' },
                            sentAt: { type: 'string' }
                        },
                        required: ['processedRecipients', 'sentAt']
                    }
                },
                required: ['message', 'data']
            },
            202: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            sentAt: { type: 'string' }
                        },
                        required: ['sentAt']
                    }
                },
                required: ['message', 'data']
            },
            400: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};