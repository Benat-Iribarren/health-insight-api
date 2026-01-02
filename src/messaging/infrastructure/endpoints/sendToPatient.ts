import { FastifyInstance } from 'fastify';
import { SendToPatient, patientEmailNotFoundErrorMsg } from '../../application/SendToPatient';
import { PatientContactRepository } from '../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../domain/interfaces/MailRepository';

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

                if (result === patientEmailNotFoundErrorMsg) {
                    return reply.status(404).send({ error: 'Patient email not found' });
                }

                return reply.status(200).send({ status: 'success' });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        });
    };
}