import { FastifyInstance } from 'fastify';
import { SendToPatient } from '../../application/SendToPatient';
import { PatientContactRepository } from '../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { MESSAGING_RESPONSES } from '../../domain/MessagingError';

interface SendToPatientDependencies {
    patientContactRepo: PatientContactRepository;
    mailRepo: MailRepository;
}

export default function sendToPatient(deps: SendToPatientDependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-to-patient', async (request, reply) => {
            try {
                const { patientId, subject, body } = request.body as {
                    patientId: number,
                    subject: string,
                    body: string
                };

                const service = new SendToPatient(deps.patientContactRepo, deps.mailRepo);
                const result = await service.execute({ patientId, subject, body });

                if (result === MESSAGING_RESPONSES.ERRORS.PATIENT_EMAIL_NOT_FOUND.code) {
                    const errorConfig = MESSAGING_RESPONSES.ERRORS.PATIENT_EMAIL_NOT_FOUND;
                    return reply.status(errorConfig.status).send({
                        status: 'error',
                        error: { code: errorConfig.code, message: errorConfig.message }
                    });
                }

                const successConfig = MESSAGING_RESPONSES.SUCCESS.SEND_TO_PATIENT;
                return reply.status(successConfig.code).send({
                    status: successConfig.status,
                    message: successConfig.message
                });
            } catch (error) {
                fastify.log.error(error);
                const internal = MESSAGING_RESPONSES.ERRORS.INTERNAL_ERROR;
                return reply.status(internal.status).send({
                    status: 'error',
                    error: { code: internal.code, message: internal.message }
                });
            }
        });
    };
}