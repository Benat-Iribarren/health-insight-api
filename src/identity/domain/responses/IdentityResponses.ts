export const IDENTITY_RESPONSES = {
    ERRORS: {
        INVALID_TOKEN: {
            status: 401,
            message: 'Token inválido o expirado'
        },
        UNAUTHORIZED: {
            status: 401,
            message: 'No autorizado'
        },
        FORBIDDEN_HYBRID_ACCESS: {
            status: 403,
            message: 'Solo el personal profesional o tareas del sistema pueden acceder a este recurso'
        },
        FORBIDDEN_PROFESSIONAL_ONLY: {
            status: 403,
            message: 'Solo los profesionales pueden acceder a este recurso'
        },
        FORBIDDEN_PATIENT_ONLY: {
            status: 403,
            message: 'Solo los pacientes pueden acceder a este recurso'
        }
    }
} as const;
