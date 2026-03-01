import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const biometricDetailProperties = {
    timestampIso: { type: 'string' },
    timestampUnixMs: { type: 'number' },
    pulseRateBpm: { type: ['number', 'null'] },
    edaSclUsiemens: { type: ['number', 'null'] },
    temperatureCelsius: { type: ['number', 'null'] },
    accelStdG: { type: ['number', 'null'] },
    respiratoryRateBrpm: { type: ['number', 'null'] },
    bodyPositionType: { type: ['string', 'null'] },
};

const statsSchema = {
    type: 'object',
    properties: { avg: { type: 'number' }, max: { type: 'number' }, min: { type: 'number' } },
    required: ['avg', 'max', 'min'],
    additionalProperties: false,
};

const summaryMetricSchema = {
    type: 'object',
    properties: { pre: statsSchema, session: statsSchema, post: statsSchema },
    required: ['pre', 'session', 'post'],
    additionalProperties: false,
};

const metricSummarySchema = {
    type: 'object',
    properties: {
        edaSclUsiemens: summaryMetricSchema,
        pulseRateBpm: summaryMetricSchema,
        temperatureCelsius: summaryMetricSchema,
    },
    required: ['edaSclUsiemens', 'pulseRateBpm', 'temperatureCelsius'],
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
                summary: { anyOf: [metricSummarySchema, { type: 'object', additionalProperties: false, properties: {} }] },
                biometricDetails: {
                    type: 'array',
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: biometricDetailProperties,
                        required: Object.keys(biometricDetailProperties),
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
                required: ['data'],
                properties: {
                    data: { anyOf: [unifiedSessionReportSchema, { type: 'array', items: unifiedSessionReportSchema }] },
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