export const invalidNotificationIdError = 'INVALID_NOTIFICATION_ID' as const;
export const alreadyRespondedError = 'ALREADY_RESPONDED' as const;
export const operationFailedError = 'OPERATION_FAILED' as const;

export type RespondToNotificationError =
    | typeof invalidNotificationIdError
    | typeof alreadyRespondedError
    | typeof operationFailedError;
