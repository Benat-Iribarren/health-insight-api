export const invalidResponseIdError = 'INVALID_RESPONSE_ID' as const;
export const notFoundError = 'NOT_FOUND' as const;
export const operationFailedError = 'OPERATION_FAILED' as const;

export type ManageResponsesError =
    | typeof invalidResponseIdError
    | typeof notFoundError
    | typeof operationFailedError;
