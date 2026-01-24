import { FastifyInstance } from 'fastify';
import { DropoutRepository } from '../../../domain/interfaces/DropoutRepository';
import { processDropoutAnalysis } from '../../../application/services/DropoutAnalysisService';
import { predictDropoutSchema } from './schema';
import {
    invalidPatientIdErrorStatusMsg,
    PredictDropoutErrors,
} from './errors';

export const PREDICT_DROPOUT_ENDPOINT = '/clinical-intelligence/predict-dropout/:patientId?';

const statusToMessage: Record<PredictDropoutErrors, { error: string }> = {
    INVALID_PATIENT_ID: { error: 'The provided patient ID is invalid.' },
    NO_DATA: { error: 'No clinical data found for analysis.' },
    ANALYSIS_FAILED: { error: 'An error occurred during clinical analysis.' },
};

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<PredictDropoutErrors | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_PATIENT_ID: 400,
    NO_DATA: 404,
    ANALYSIS_FAILED: 500,
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

                if (invalidParameters(rawId, patientId)) {
                    return reply
                        .status(statusToCode[invalidPatientIdErrorStatusMsg])
                        .send(statusToMessage[invalidPatientIdErrorStatusMsg]);
                }

                const body = await processDropoutAnalysis(dependencies.dropoutRepo, patientId);

                if (typeof body === 'string') {
                    return reply
                        .status(statusToCode[body as PredictDropoutErrors])
                        .send(statusToMessage[body as PredictDropoutErrors]);
                }

                const responseData = (patientId && Array.isArray(body)) ? body[0] : body;
                return reply.status(statusToCode.SUCCESSFUL).send(responseData);
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        });
    };
}

function invalidParameters(rawId: string | undefined, patientId: number | undefined): boolean {
    return rawId !== undefined && (isNaN(patientId!) || patientId! <= 0);
}

export default predictDropout;