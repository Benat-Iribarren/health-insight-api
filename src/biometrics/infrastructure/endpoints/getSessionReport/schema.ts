import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const statsSchema = {
    type: 'object',
    properties: {
        avg: { type: 'number' },
        max: { type: 'number' },
        min: { type: 'number' }
    },
    required: ['avg', 'max', 'min'],
    additionalProperties: false,
};

const summaryMetricSchema = {
    type: 'object',
    properties: {
        pre: statsSchema,
        session: statsSchema,
        post: statsSchema
    },
    required: ['pre', 'session', 'post'],
    additionalProperties: false,
};

const unifiedSessionReportSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['sessionId', 'state', 'dizzinessPercentage', 'subjectiveAnalysis', 'objectiveAnalysis'],
    properties: {
        sessionId: { type: 'string' },
        state: { type: 'string' },
        dizzinessPercentage: { type: 'number' },
        noBiometrics: { type: 'boolean' },
        subjectiveAnalysis: {
            type: 'object',
            additionalProperties: false,
            required: ['preEvaluation', 'postEvaluation', 'delta'],
            properties: {
                preEvaluation: { type: 'number' },
                postEvaluation: { type: 'number' },
                delta: { type: 'number' },
            },
        },
        objectiveAnalysis: {
            type: 'object',
            additionalProperties: false,
            required: ['summary', 'biometricDetails'],
            properties: {
                summary: {
                    anyOf: [
                        {
                            type: 'object',
                            additionalProperties: false,
                            required: ['edaSclUsiemens', 'pulseRateBpm', 'temperatureCelsius'],
                            properties: {
                                edaSclUsiemens: summaryMetricSchema,
                                pulseRateBpm: summaryMetricSchema,
                                temperatureCelsius: summaryMetricSchema,
                            },
                        },
                        { type: 'object', additionalProperties: false, properties: {} }
                    ]
                },
                biometricDetails: {
                    type: 'array',
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['timestampIso', 'timestampUnixMs', 'pulseRateBpm', 'edaSclUsiemens', 'temperatureCelsius', 'accelStdG', 'respiratoryRateBrpm', 'bodyPositionType'],
                        properties: {
                            timestampIso: { type: 'string' },
                            timestampUnixMs: { type: 'number' },
                            pulseRateBpm: { type: ['number', 'null'] },
                            edaSclUsiemens: { type: ['number', 'null'] },
                            temperatureCelsius: { type: ['number', 'null'] },
                            accelStdG: { type: ['number', 'null'] },
                            respiratoryRateBrpm: { type: ['number', 'null'] },
                            bodyPositionType: { type: ['string', 'null'] },
                            phase: { type: ['string', 'null'], enum: ['pre', 'session', 'post', null] },
                        },
                    },
                },
            },
        },
    },
};

export const getSessionReportSchema = {
    schema: {
        params: {
            type: 'object',
            additionalProperties: false,
            required: ['patientId'],
            properties: {
                patientId: { type: 'string', minLength: 1 },
                sessionId: { type: 'string' },
            },
        },
        querystring: {
            type: 'object',
            additionalProperties: true,
            properties: {
                page: { type: 'string' },
                limit: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['data', 'meta'],
                properties: {
                    data: {
                        anyOf: [
                            { type: 'array', items: unifiedSessionReportSchema },
                            unifiedSessionReportSchema
                        ]
                    },
                    meta: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['total', 'page', 'limit'],
                        properties: {
                            total: { type: 'number' },
                            page: { type: 'number' },
                            limit: { type: 'number' },
                        },
                    },
                },
            },
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};