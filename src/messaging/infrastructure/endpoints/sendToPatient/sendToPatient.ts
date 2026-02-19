import { FastifyInstance } from 'fastify';
import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { MailTemplateProvider } from '../../../domain/interfaces/MailTemplateProvider';
import { SendToPatientService } from '../../../application/services/SendToPatientService';
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
    INVALID_PATIENT_ID: { error: 'Invalid input' },
    PATIENT_NOT_FOUND: { error: 'No data found' },
    SEND_FAILED: { error: 'Internal server error' },
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

                const result = await SendToPatientService(
                    dependencies.patientContactRepo,
                    dependencies.mailRepo,
                    dependencies.notificationRepo,
                    dependencies.templateProvider,
                    patientId,
                    subject,
                    body
                );

                if (result !== 'SUCCESSFUL') {
                    return reply.status(statusToCode[result]).send({
                        ...statusToMessage[result as SendToPatientError]
                    });
                }

                return reply.status(statusToCode.SUCCESSFUL).send({
                    message: 'Message sent and notification logged.',
                    data: {
                        recipientId: patientId,
                        sentAt: new Date().toISOString()
                    }
                });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(statusToCode.SEND_FAILED).send(statusToMessage.SEND_FAILED);
            }
        });
    };
}

export default sendToPatient;