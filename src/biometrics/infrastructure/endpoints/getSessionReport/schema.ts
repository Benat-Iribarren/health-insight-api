import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const biometricMinuteProperties = {
    timestamp_iso: { type: 'string' },
    timestamp_unix_ms: { type: 'number' },
    pulse_rate_bpm: { type: ['number', 'null'] },
    eda_scl_usiemens: { type: ['number', 'null'] },
    temperature_celsius: { type: ['number', 'null'] },
    accel_std_g: { type: ['number', 'null'] },
    respiratory_rate_brpm: { type: ['number', 'null'] },
    body_position_type: { type: ['string', 'null'] },
};

const summaryMetricSchema = {
    type: 'object',
    properties: {
        pre: {
            type: 'object',
            properties: { avg: { type: 'number' }, max: { type: 'number' }, min: { type: 'number' } },
            required: ['avg', 'max', 'min'],
            additionalProperties: false,
        },
        session: {
            type: 'object',
            properties: { avg: { type: 'number' }, max: { type: 'number' }, min: { type: 'number' } },
            required: ['avg', 'max', 'min'],
            additionalProperties: false,
        },
        post: {
            type: 'object',
            properties: { avg: { type: 'number' }, max: { type: 'number' }, min: { type: 'number' } },
            required: ['avg', 'max', 'min'],
            additionalProperties: false,
        },
    },
    required: ['pre', 'session', 'post'],
    additionalProperties: false,
};

const reportSchema = {
    type: 'object',
    properties: {
        session_id: { type: 'string' },
        state: { type: 'string' },
        dizziness_percentage: { type: 'number' },
        no_biometrics: { type: 'boolean' },
        subjective_analysis: {
            type: 'object',
            properties: {
                pre_evaluation: { type: 'number' },
                post_evaluation: { type: 'number' },
                delta: { type: 'number' },
            },
            required: ['pre_evaluation', 'post_evaluation', 'delta'],
            additionalProperties: false,
        },
        objective_analysis: {
            type: 'object',
            properties: {
                summary: {
                    type: 'object',
                    properties: {
                        eda_scl_usiemens: summaryMetricSchema,
                        pulse_rate_bpm: summaryMetricSchema,
                        temperature_celsius: summaryMetricSchema,
                    },
                    additionalProperties: false,
                },
                biometric_details: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: biometricMinuteProperties,
                        required: ['timestamp_iso', 'timestamp_unix_ms'],
                        additionalProperties: false,
                    },
                },
            },
            required: ['summary', 'biometric_details'],
            additionalProperties: false,
        },
    },
    required: ['session_id', 'state', 'dizziness_percentage', 'subjective_analysis', 'objective_analysis'],
    additionalProperties: false,
};

const paginationMetaSchema = {
    type: 'object',
    properties: {
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
    },
    required: ['total', 'page', 'limit'],
    additionalProperties: false
};

export const getSessionReportSchema = {
    schema: {
        params: {
            type: 'object',
            properties: {
                patientId: { type: 'string' },
                sessionId: { type: 'string' },
            },
            required: ['patientId'],
            additionalProperties: false,
        },
        querystring: {
            type: 'object',
            properties: {
                page: { type: 'string', pattern: '^[0-9]+$' },
                limit: { type: 'string', pattern: '^[0-9]+$' }
            },
            additionalProperties: false
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    data: {
                        oneOf: [
                            { type: 'array', items: reportSchema },
                            reportSchema
                        ]
                    },
                    meta: paginationMetaSchema
                },
                required: ['data'],
                additionalProperties: false
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};