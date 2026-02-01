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
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            recipientId: { type: 'number' },
                            sentAt: { type: 'string' }
                        },
                        required: ['recipientId', 'sentAt']
                    }
                },
                required: ['message', 'data'],
            },
            400: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};