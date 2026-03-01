import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

export const predictDropoutSchema = {
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
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        patientId: { type: 'number' },
                        name: { type: 'string' },
                        riskScore: { type: 'number' },
                        status: { type: 'string', enum: ['CRITICAL', 'MODERATE', 'LOW'] },
                        bufferDays: { type: 'number' },
                        factors: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    },
                    required: ['patientId', 'name', 'riskScore', 'status', 'bufferDays', 'factors']
                }
            },
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};