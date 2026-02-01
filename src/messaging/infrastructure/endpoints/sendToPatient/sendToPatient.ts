import { FastifyInstance } from 'fastify';
import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { MailTemplateProvider } from '../../../domain/interfaces/MailTemplateProvider';
import { sendToPatientService } from '../../../application/services/SendToPatientService';
import { SendToPatientError } from '../../../application/types/SendToPatientError';
import { sendToPatientSchema } from './schema';

export const SEND_TO_PATIENT_ENDPOINT = '/messaging/send-to-patient/:patientId';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<SendToPatientError | 'INVALID_PATIENT_ID' | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_PATIENT_ID: 400,
    PATIENT_NOT_FOUND: 404,
    SEND_FAILED: 500,
};

const statusToMessage: Record<SendToPatientError | 'INVALID_PATIENT_ID', { error: string }> = {
    INVALID_PATIENT_ID: { error: 'The provided patient ID is invalid.' },
    PATIENT_NOT_FOUND: { error: 'Patient not found.' },
    SEND_FAILED: { error: 'An error occurred while sending the message.' },
};

interface SendToPatientDependencies {
    patientContactRepo: PatientContactRepository;
    mailRepo: MailRepository;
    notificationRepo: NotificationRepository;
    templateProvider: MailTemplateProvider;
}

function sendToPatient(dependencies: SendToPatientDependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.post(SEND_TO_PATIENT_ENDPOINT, sendToPatientSchema, async (request, reply) => {
            try {
                const { patientId: rawId } = request.params as { patientId: string };
                const patientId = Number(rawId);

                if (Number.isNaN(patientId) || patientId <= 0) {
                    return reply.status(statusToCode.INVALID_PATIENT_ID).send(statusToMessage.INVALID_PATIENT_ID);
                }

                const { subject, body } = request.body as { subject: string; body: string };

                const result = await sendToPatientService(
                    dependencies.patientContactRepo,
                    dependencies.mailRepo,
                    dependencies.notificationRepo,
                    dependencies.templateProvider,
                    patientId,
                    subject,
                    body
                );

                if (result !== 'SUCCESSFUL') {
                    return reply.status(statusToCode[result]).send(statusToMessage[result]);
                }

                return reply.status(200).send({
                    message: 'Message sent and notification logged.',
                    data: {
                        recipientId: patientId,
                        sentAt: new Date().toISOString()
                    }
                });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    error: 'Internal Server Error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    };
}
export default sendToPatient;