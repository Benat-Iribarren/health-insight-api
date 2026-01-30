import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const syncDailyBiometricsSchema = {
    schema: {
        body: {
            type: 'object',
            properties: {
                date: { type: 'string' },
            },
            additionalProperties: false,
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['success'] },
                    dateProcessed: { type: 'string' },
                    summary: {
                        type: 'object',
                        properties: {
                            filesFound: { type: 'number' },
                            rowsInserted: { type: 'number' },
                        },
                        required: ['filesFound', 'rowsInserted'],
                        additionalProperties: false,
                    },
                },
                required: ['status', 'dateProcessed', 'summary'],
                additionalProperties: false,
            },
            202: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['accepted'] },
                    targetDate: { type: 'string' },
                    message: { type: 'string' },
                },
                required: ['status', 'targetDate', 'message'],
                additionalProperties: false,
            },
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};
