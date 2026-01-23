export const BIOMETRICS_RESPONSES = {
    SUCCESS: {
        OK: {
            status: 200,
            message: 'Operación realizada correctamente'
        },
        PRESENCE_RECORDED: {
            status: 200,
            message: 'Presencia registrada correctamente'
        },
        SYNC_ACCEPTED: {
            status: 202,
            message: 'Sincronización aceptada'
        }
    },

    ERRORS: {
        INVALID_INPUT: {
            status: 400,
            message: 'Datos de entrada inválidos'
        },
        UNAUTHORIZED: {
            status: 401,
            message: 'No autorizado'
        },
        FORBIDDEN: {
            status: 403,
            message: 'Acceso no permitido'
        },
        NO_DATA_FOUND: {
            status: 404,
            message: 'No se han encontrado datos'
        },
        UNKNOWN_ERROR: {
            status: 500,
            message: 'Error interno del servidor'
        }
    }
} as const;
