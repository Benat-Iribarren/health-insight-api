export const invalidPatientIdErrorStatusMsg = 'INVALID_PATIENT_ID' as const;
export const noDataErrorStatusMsg = 'NO_DATA' as const;
export const analysisFailedErrorStatusMsg = 'ANALYSIS_FAILED' as const;

export type PredictDropoutErrors =
    | typeof invalidPatientIdErrorStatusMsg
    | typeof noDataErrorStatusMsg
    | typeof analysisFailedErrorStatusMsg;