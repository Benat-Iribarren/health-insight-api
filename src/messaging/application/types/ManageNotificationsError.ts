export const invalidNotificationIdError = 'INVALID_NOTIFICATION_ID' as const;
export const notFoundError = 'NOT_FOUND' as const;
export const operationFailedError = 'OPERATION_FAILED' as const;

export type ManageNotificationsError =
    | typeof invalidNotificationIdError
    | typeof notFoundError
    | typeof operationFailedError;
