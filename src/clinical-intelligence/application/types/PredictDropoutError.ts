export const noDataError = 'NO_DATA' as const;
export const analysisFailedError = 'ANALYSIS_FAILED' as const;

export type PredictDropoutError = typeof noDataError | typeof analysisFailedError;