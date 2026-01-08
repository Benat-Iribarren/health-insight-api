import { FastifyInstance } from 'fastify';
import { DropoutAnalysisService } from '../../application/DropoutAnalysisService';
import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { CLINICAL_RESPONSES } from '../../domain/ClinicalError';

export default function predictDropout(dependencies: { dropoutRepo: DropoutRepository }) {
    return async function (fastify: FastifyInstance) {
        const service = new DropoutAnalysisService(dependencies.dropoutRepo);

        fastify.get('/clinical-intelligence/predict-dropout/:patientId?', async (request, reply) => {
            const { patientId } = request.params as { patientId?: string };

            if (patientId && isNaN(Number(patientId))) {
                const noData = CLINICAL_RESPONSES.ERRORS.NO_DATA;
                return reply.status(noData.status).send({
                    status: 'error',
                    error: { code: noData.code, message: noData.message }
                });
            }

            try {
                const result = await service.execute(patientId);

                if ('type' in result) {
                    const errorConfig = Object.values(CLINICAL_RESPONSES.ERRORS).find(
                        (e) => e.code === result.type
                    );

                    if (!errorConfig) {
                        const internal = CLINICAL_RESPONSES.ERRORS.ANALYSIS_FAILED;
                        return reply.status(internal.status).send({
                            status: 'error',
                            error: { code: internal.code, message: internal.message }
                        });
                    }

                    return reply.status(errorConfig.status).send({
                        status: 'error',
                        error: { code: errorConfig.code, message: errorConfig.message }
                    });
                }

                const successConfig = CLINICAL_RESPONSES.SUCCESS.ANALYSIS_COMPLETED;

                if (patientId && (result as any[]).length === 0) {
                    const noData = CLINICAL_RESPONSES.ERRORS.NO_DATA;
                    return reply.status(noData.status).send({
                        status: 'error',
                        error: { code: noData.code, message: noData.message }
                    });
                }

                return reply.status(successConfig.code).send({
                    status: successConfig.status,
                    message: successConfig.message,
                    data: patientId ? result[0] : result
                });

            } catch (error) {
                fastify.log.error(error);
                const internal = CLINICAL_RESPONSES.ERRORS.ANALYSIS_FAILED;
                return reply.status(internal.status).send({
                    status: 'error',
                    error: { code: internal.code, message: internal.message }
                });
            }
        });
    };
}