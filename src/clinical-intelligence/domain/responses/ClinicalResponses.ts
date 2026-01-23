export const CLINICAL_RESPONSES = {
    SUCCESS: {
        ANALYSIS_COMPLETED: {
            status: 200,
            message: 'Predicción generada correctamente'
        }
    },

    ERRORS: {
        INVALID_PATIENT_ID: {
            status: 400,
            message: 'El identificador del paciente no es válido'
        },
        NO_DATA: {
            status: 404,
            message: 'No hay datos suficientes para la predicción'
        },
        ANALYSIS_FAILED: {
            status: 500,
            message: 'No se pudo completar el análisis clínico'
        }
    }
} as const;
