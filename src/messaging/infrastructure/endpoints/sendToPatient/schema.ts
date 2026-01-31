import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const sendToPatientSchema = {
    schema: {
        params: {
            type: 'object',
            additionalProperties: false,
            properties: {
                patientId: { type: 'string' },
            },
            required: ['patientId'],
        },
        body: {
            type: 'object',
            additionalProperties: false,
            properties: {
                subject: { type: 'string' },
                body: { type: 'string' },
            },
            required: ['subject', 'body'],
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: { ok: { type: 'boolean' } },
                required: ['ok'],
            },
            400: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};
