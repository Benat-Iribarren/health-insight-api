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
                    additionalProperties: false,
                    properties: dropoutRiskProperties,
                    required: ['patientId', 'name', 'riskScore', 'status'],
                },
            },
            400: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};
