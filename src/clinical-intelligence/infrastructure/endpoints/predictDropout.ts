import { FastifyInstance, FastifyReply } from 'fastify';
import { DropoutAnalysisService } from '../../application/DropoutAnalysisService';
import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { CLINICAL_RESPONSES } from '../../domain/responses/ClinicalResponses';

const sendError = (reply: FastifyReply, err: { status: number; message: string }) =>
    reply.status(err.status).send({
        status: 'error',
        message: err.message
    });

const sendSuccess = (reply: FastifyReply, res: { status: number; message: string }, data: unknown) =>
    reply.status(res.status).send({
        status: 'success',
        message: res.message,
        data
    });

export default function predictDropout(dependencies: { dropoutRepo: DropoutRepository }) {
    return async function (fastify: FastifyInstance) {
        const service = new DropoutAnalysisService(dependencies.dropoutRepo);

        fastify.get('/clinical-intelligence/predict-dropout/:patientId?', async (request, reply) => {
            const { patientId } = request.params as { patientId?: string };

            if (patientId && Number.isNaN(Number(patientId))) {
                return sendError(reply, CLINICAL_RESPONSES.ERRORS.INVALID_PATIENT_ID);
            }

            try {
                const result = await service.execute(patientId);

                if (!result || (Array.isArray(result) && result.length === 0)) {
                    return sendError(reply, CLINICAL_RESPONSES.ERRORS.NO_DATA);
                }

                const res = CLINICAL_RESPONSES.SUCCESS.ANALYSIS_COMPLETED;
                const data = patientId && Array.isArray(result) ? result[0] : result;

                return sendSuccess(reply, res, data);
            } catch (error) {
                fastify.log.error(error);
                return sendError(reply, CLINICAL_RESPONSES.ERRORS.ANALYSIS_FAILED);
            }
        });
    };
}
