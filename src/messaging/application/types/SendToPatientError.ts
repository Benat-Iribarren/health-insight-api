export const invalidInputError = 'INVALID_INPUT' as const;
export const noEmailError = 'NO_EMAIL' as const;
export const operationFailedError = 'OPERATION_FAILED' as const;

export type SendToPatientError =
    | typeof invalidInputError
    | typeof noEmailError
    | typeof operationFailedError;
