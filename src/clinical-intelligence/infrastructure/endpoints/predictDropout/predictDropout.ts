import { FastifyInstance } from 'fastify';
import { DropoutRepository } from '../../../domain/interfaces/DropoutRepository';
import { DropoutAnalysisService } from '../../../application/services/DropoutAnalysisService';
import { PredictDropoutError } from '../../../application/types/PredictDropoutError';
import { predictDropoutSchema } from './schema';

export const PREDICT_DROPOUT_ENDPOINT = '/clinical-intelligence/predict-dropout/:patientId?';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<PredictDropoutError | 'INVALID_PATIENT_ID' | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_PATIENT_ID: 400,
    NO_DATA: 404,
    ANALYSIS_FAILED: 500,
};

const statusToMessage: Record<PredictDropoutError | 'INVALID_PATIENT_ID', { error: string }> = {
    INVALID_PATIENT_ID: { error: 'The provided patient ID is invalid.' },
    NO_DATA: { error: 'No data found' },
    ANALYSIS_FAILED: { error: 'Internal server error' },
};

interface PredictDropoutDependencies {
    dropoutRepo: DropoutRepository;
}

function predictDropout(dependencies: PredictDropoutDependencies) {
    return async function (fastify: FastifyInstance) {
        const useCase = new DropoutAnalysisService(dependencies.dropoutRepo);

        fastify.get(PREDICT_DROPOUT_ENDPOINT, predictDropoutSchema, async (request, reply) => {
            const { patientId: rawId } = request.params as { patientId?: string };

            const patientId = rawId ? Number(rawId) : undefined;

            if (rawId !== undefined && (Number.isNaN(patientId as number) || (patientId as number) <= 0)) {
                return reply.status(statusToCode.INVALID_PATIENT_ID).send(statusToMessage.INVALID_PATIENT_ID);
            }

            const result = await useCase.execute(patientId);

            if (typeof result === 'string') {
                return reply.status(statusToCode[result]).send(statusToMessage[result]);
            }

            return reply.status(statusToCode.SUCCESSFUL).send(result);
        });
    };
}

export default predictDropout;