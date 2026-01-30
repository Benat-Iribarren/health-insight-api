export const invalidInputError = 'INVALID_INPUT' as const;
export const unauthorizedError = 'UNAUTHORIZED' as const;
export const forbiddenError = 'FORBIDDEN' as const;
export const noDataFoundError = 'NO_DATA_FOUND' as const;
export const unknownError = 'UNKNOWN_ERROR' as const;

export type BiometricsError =
    | typeof invalidInputError
    | typeof unauthorizedError
    | typeof forbiddenError
    | typeof noDataFoundError
    | typeof unknownError;
