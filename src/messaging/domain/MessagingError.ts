export const MESSAGING_RESPONSES = {
    SUCCESS: {
        SEND_TO_PATIENT: {
            status: 'success',
            code: 200,
            message: 'Mensaje enviado correctamente al paciente.'
        },
        SEND_WEEKLY_STATS: {
            status: 'success',
            code: 200,
            getMessage: (count: number) => `Informes enviados a ${count} pacientes.`
        }
    },
    ERRORS: {
        PATIENT_EMAIL_NOT_FOUND: {
            code: 'PATIENT_EMAIL_NOT_FOUND',
            message: 'No se ha encontrado un email asociado a este paciente.',
            status: 404
        },
        NO_STATS_DATA: {
            code: 'NO_STATS_DATA',
            message: 'No hay actividad registrada para generar el informe semanal.',
            status: 404
        },
        MAIL_FAILURE: {
            code: 'MAIL_SENDING_FAILED',
            message: 'El servicio de mensajería no ha podido enviar el correo.',
            status: 500
        },
        INTERNAL_ERROR: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Ha ocurrido un error inesperado en el servidor.',
            status: 500
        }
    }
} as const;

export type MessagingErrorType = keyof typeof MESSAGING_RESPONSES.ERRORS;