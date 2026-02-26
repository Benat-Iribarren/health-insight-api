import { FastifyInstance } from 'fastify';
import { PatientResponseRepository } from '../../../domain/interfaces/PatientResponseRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import {
    GetResponsesService,
    ReadResponseService,
    DeleteResponseService,
    ManageResponsesError,
} from '../../../application/services/ResponsesService';
import { getResponsesSchema, markResponseAsReadSchema, deleteResponseSchema } from './schema';

export const GET_RESPONSES_ENDPOINT = '/messaging/responses';
export const MARK_RESPONSE_AS_READ_ENDPOINT = '/messaging/responses/:responseId';
export const DELETE_RESPONSE_ENDPOINT = '/messaging/responses/:responseId';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<ManageResponsesError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_RESPONSE_ID: 400,
    NOT_FOUND: 404,
    OPERATION_FAILED: 500,
};

const statusToMessage: Record<ManageResponsesError, { error: string }> = {
    INVALID_RESPONSE_ID: { error: 'Invalid input' },
    NOT_FOUND: { error: 'No data found' },
    OPERATION_FAILED: { error: 'Internal server error' },
};

interface PatientResponsesDependencies {
    patientResponseRepo: PatientResponseRepository;
    notificationRepo: NotificationRepository;
}

function patientResponses(dependencies: PatientResponsesDependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.get(GET_RESPONSES_ENDPOINT, getResponsesSchema, async (_request, reply) => {
            const result = await GetResponsesService(dependencies.patientResponseRepo, dependencies.notificationRepo);

            if (typeof result === 'string') {
                return reply.status(500).send({ error: 'Internal server error' });
            }

            return reply.status(200).send(result);
        });

        fastify.patch(MARK_RESPONSE_AS_READ_ENDPOINT, markResponseAsReadSchema, async (request, reply) => {
            const { responseId } = request.params as { responseId: string };
            const result = await ReadResponseService(dependencies.patientResponseRepo, responseId);
            if (result !== 'SUCCESSFUL') {
                return reply.status(statusToCode[result]).send(statusToMessage[result]);
            }
            return reply.status(statusToCode.SUCCESSFUL).send({ message: 'Response marked as read.' });
        });

        fastify.delete(DELETE_RESPONSE_ENDPOINT, deleteResponseSchema, async (request, reply) => {
            const { responseId } = request.params as { responseId: string };
            const result = await DeleteResponseService(
                dependencies.notificationRepo,
                dependencies.patientResponseRepo,
                responseId
            );
            if (result !== 'SUCCESSFUL') {
                return reply.status(statusToCode[result]).send(statusToMessage[result]);
            }
            return reply.status(statusToCode.SUCCESSFUL).send({ message: 'Response deleted.' });
        });
    };
}

export default patientResponses;