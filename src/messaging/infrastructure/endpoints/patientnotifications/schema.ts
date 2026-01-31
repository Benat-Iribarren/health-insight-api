import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const notificationProperties = {
    id: { type: 'string' },
    patient_id: { type: 'number' },
    subject: { type: 'string' },
    content: { type: 'string' },
    is_read: { type: 'boolean' },
    created_at: { type: 'string' },
};

export const getNotificationsSchema = {
    schema: {
        response: {
            200: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: notificationProperties,
                    required: ['id', 'patient_id', 'subject', 'content', 'is_read', 'created_at'],
                },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};

export const readNotificationSchema = {
    schema: {
        params: {
            type: 'object',
            additionalProperties: false,
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: notificationProperties,
                required: ['id', 'patient_id', 'subject', 'content', 'is_read', 'created_at'],
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};

export const deleteNotificationSchema = {
    schema: {
        params: {
            type: 'object',
            additionalProperties: false,
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: { ok: { type: 'boolean' } },
                required: ['ok'],
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};
