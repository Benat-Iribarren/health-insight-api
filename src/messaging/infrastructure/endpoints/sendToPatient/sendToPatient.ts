import { FastifyInstance } from 'fastify';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../../domain/interfaces/MailRepository';
import { MailTemplateProvider } from '../../../domain/interfaces/MailTemplateProvider';
import { SendToPatientService } from '../../../application/services/SendToPatientService';
import { SendToPatientError } from '../../../application/types/SendToPatientError';
import { sendToPatientSchema } from './schema';

export const SEND_TO_PATIENT_ENDPOINT = '/messaging/send';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<SendToPatientError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_INPUT: 400,
    NO_EMAIL: 404,
    OPERATION_FAILED: 500,
};

const statusToMessage: Record<SendToPatientError, { error: string }> = {
    INVALID_INPUT: { error: 'Invalid input' },
    NO_EMAIL: { error: 'No email found' },
    OPERATION_FAILED: { error: 'Internal server error' },
};

interface SendDependencies {
    notificationRepo: NotificationRepository;
    patientContactRepo: PatientContactRepository;
    mailRepo: MailRepository;
    templateProvider: MailTemplateProvider;
}

function sendToPatient(deps: SendDependencies) {
    return async function (fastify: FastifyInstance) {
        const useCase = new SendToPatientService(
            deps.notificationRepo,
            deps.patientContactRepo,
            deps.mailRepo,
            deps.templateProvider
        );

        fastify.post(SEND_TO_PATIENT_ENDPOINT, sendToPatientSchema, async (request, reply) => {
            const body = request.body as { patientId: number; subject: string; content: string };
            const result = await useCase.execute(body);

            if (result !== 'SUCCESSFUL') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send({ message: 'Sent successfully' });
        });
    };
}

export default sendToPatient;