import { errorSchema } from '@common/infrastructure/endpoints/errorSchema';

const notificationItem = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'patientId', 'subject', 'content', 'isRead', 'createdAt'],
    properties: {
        id: { type: 'string' },
        patientId: { type: 'number' },
        subject: { type: 'string' },
        content: { type: 'string' },
        isRead: { type: 'boolean' },
        createdAt: { type: 'string' },
    },
};

export const getNotificationsSchema = {
    schema: {
        response: {
            200: { type: 'array', items: notificationItem },
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
            required: ['id'],
            properties: { id: { type: 'string' } },
        },
        response: {
            200: notificationItem,
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
            required: ['id'],
            properties: { id: { type: 'string' } },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'message'],
                properties: {
                    id: { type: 'string' },
                    message: { type: 'string' },
                },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};