import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const sendWeeklyStatsSchema = {
    schema: {
        params: {
            type: 'object',
            additionalProperties: false,
            properties: {
                patientId: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['sent', 'skippedNoEmail'],
                properties: {
                    sent: { type: 'number' },
                    skippedNoEmail: { type: 'number' },
                },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};