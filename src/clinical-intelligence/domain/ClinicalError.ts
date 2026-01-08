export const CLINICAL_RESPONSES = {
    SUCCESS: {
        ANALYSIS_COMPLETED: {
            code: 200,
            status: 'success',
            message: 'Análisis clínico completado correctamente.'
        }
    },
    ERRORS: {
        NO_DATA: {
            code: 'NO_HEALTH_DATA_FOUND',
            message: 'No hay datos suficientes para realizar el análisis.',
            status: 404
        },
        ANALYSIS_FAILED: {
            code: 'HEALTH_ANALYSIS_FAILED',
            message: 'Error interno al procesar los datos clínicos.',
            status: 500
        }
    }
} as const;