import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const sendToPatientSchema = {
    schema: {
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['patientId', 'subject', 'content'],
            properties: {
                patientId: { type: 'number' },
                subject: { type: 'string' },
                content: { type: 'string' },
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