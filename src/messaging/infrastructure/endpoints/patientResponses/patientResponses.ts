import { FastifyInstance } from 'fastify';
import { ResponseRepository } from '../../../domain/interfaces/ResponseRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { GetAllResponsesService } from '../../../application/services/GetAllResponsesService';
import { MarkResponseAsReadService } from '../../../application/services/MarkResponseAsReadService';
import { DeleteResponseService } from '../../../application/services/DeleteResponseService';
import { ManageResponsesError } from '../../../application/types/ManageResponsesError';
import { getResponsesSchema, markResponseAsReadSchema, deleteResponseSchema } from './schema';

export const GET_RESPONSES_ENDPOINT = '/messaging/responses';
export const RESPONSE_BY_ID_ENDPOINT = '/messaging/responses/:responseId';

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
    responseRepo: ResponseRepository;
    notificationRepo: NotificationRepository;
}

function patientResponses(deps: PatientResponsesDependencies) {
    return async function (fastify: FastifyInstance) {
        const getAll = new GetAllResponsesService(deps.responseRepo, deps.notificationRepo);
        const markRead = new MarkResponseAsReadService(deps.responseRepo);
        const del = new DeleteResponseService(deps.responseRepo, deps.notificationRepo);

        fastify.get(GET_RESPONSES_ENDPOINT, getResponsesSchema, async (_request, reply) => {
            const result = await getAll.execute();
            if (typeof result === 'string') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send(result);
        });

        fastify.patch(RESPONSE_BY_ID_ENDPOINT, markResponseAsReadSchema, async (request, reply) => {
            const { responseId } = request.params as { responseId: string };
            const result = await markRead.execute(responseId);
            if (result !== 'SUCCESSFUL') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send({ message: 'Marked as read' });
        });

        fastify.delete(RESPONSE_BY_ID_ENDPOINT, deleteResponseSchema, async (request, reply) => {
            const { responseId } = request.params as { responseId: string };
            const result = await del.execute(responseId);
            if (result !== 'SUCCESSFUL') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send({ message: 'Deleted successfully' });
        });
    };
}

export default patientResponses;
