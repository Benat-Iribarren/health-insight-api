import { FastifyInstance } from 'fastify';
import { DropoutAnalysisService } from '../../application/DropoutAnalysisService';
import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';

export default function predictDropout(dependencies: { dropoutRepo: DropoutRepository }) {
    return async function (fastify: FastifyInstance) {
        const service = new DropoutAnalysisService(dependencies.dropoutRepo);

        fastify.get('/clinical-intelligence/predict-dropout/:patientId?', async (request, reply) => {
            const { patientId } = request.params as { patientId?: string };
            try {
                const analysis = await service.execute(patientId);
                if (patientId && (!analysis || analysis.length === 0)) {
                    return reply.status(404).send({ error: 'Patient not found' });
                }
                return reply.send(patientId ? analysis[0] : analysis);
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        });
    };
}