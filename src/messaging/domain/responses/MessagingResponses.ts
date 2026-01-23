export const MESSAGING_RESPONSES = {
    SUCCESS: {
        OK: {
            status: 200,
            message: 'Operación realizada correctamente'
        },
        MESSAGE_SENT: {
            status: 200,
            message: 'Mensaje enviado correctamente'
        },
        WEEKLY_STATS_SENT: {
            status: 200,
            message: 'Mensajes semanales enviados correctamente'
        }
    },

    ERRORS: {
        NOT_FOUND: {
            status: 404,
            message: 'Recurso no encontrado'
        },
        UNKNOWN_ERROR: {
            status: 500,
            message: 'Error desconocido'
        }
    }
} as const;
