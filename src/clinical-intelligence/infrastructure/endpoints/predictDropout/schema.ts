import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const dropoutRiskProperties = {
    patientId: { type: 'string' },
    name: { type: 'string' },
    riskScore: { type: 'number' },
    status: { type: 'string', enum: ['LOW', 'MODERATE', 'CRITICAL'] },
    bufferDays: { type: 'number' },
    factors: {
        type: 'array',
        items: { type: 'string' },
    },
};

export const predictDropoutSchema = {
    schema: {
        params: {
            type: 'object',
            properties: {
                patientId: { type: 'string' },
            },
        },
        response: {
            200: {
                type: ['array', 'object'],
                if: { type: 'array' },
                then: {
                    items: {
                        type: 'object',
                        properties: dropoutRiskProperties,
                        required: ['patientId', 'name', 'riskScore', 'status']
                    }
                },
                else: {
                    type: 'object',
                    properties: dropoutRiskProperties,
                    required: ['patientId', 'name', 'riskScore', 'status']
                }
            },
            400: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};