import { FastifyInstance } from 'fastify';
import { DropoutRepository } from '../../../domain/interfaces/DropoutRepository';
import { ProcessDropoutAnalysisService } from '../../../application/services/DropoutAnalysisService';
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
    NO_DATA: { error: 'No clinical data found for analysis.' },
    ANALYSIS_FAILED: { error: 'An error occurred during clinical analysis.' },
};

interface PredictDropoutDependencies {
    dropoutRepo: DropoutRepository;
}

function predictDropout(dependencies: PredictDropoutDependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.get(PREDICT_DROPOUT_ENDPOINT, predictDropoutSchema, async (request, reply) => {
            try {
                const { patientId: rawId } = request.params as { patientId?: string };
                const patientId = rawId ? Number(rawId) : undefined;

                if (isInvalidPatientId(rawId, patientId)) {
                    return reply.status(statusToCode.INVALID_PATIENT_ID).send(statusToMessage.INVALID_PATIENT_ID);
                }

                const result = await ProcessDropoutAnalysisService(dependencies.dropoutRepo, patientId);

                if (typeof result === 'string') {
                    return reply.status(statusToCode[result]).send(statusToMessage[result]);
                }

                return reply.status(statusToCode.SUCCESSFUL).send(result);
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        });
    };
}

function isInvalidPatientId(rawId: string | undefined, patientId: number | undefined): boolean {
    return rawId !== undefined && (Number.isNaN(patientId as number) || (patientId as number) <= 0);
}

export default predictDropout;
