import { PatientResponseRepository, PatientResponse } from '../../domain/interfaces/PatientResponseRepository';
import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

export type ManageResponsesError =
    | 'INVALID_RESPONSE_ID'
    | 'NOT_FOUND'
    | 'OPERATION_FAILED';

export async function GetResponsesService(
    responseRepo: PatientResponseRepository,
    notificationRepo: NotificationRepository
): Promise<PatientResponse[] | ManageResponsesError> {
    try {
        const responses = await responseRepo.getAllResponses();
        if (responses.length === 0) return [];

        const messageIds = [...new Set(responses.map(r => r.message_id))];
        const contentMap = await notificationRepo.getNotificationContents(messageIds);

        return responses.map(r => ({
            ...r,
            message: contentMap[r.message_id] || ''
        }));
    } catch {
        return 'OPERATION_FAILED';
    }
}

export async function ReadResponseService(
    responseRepo: PatientResponseRepository,
    responseId: string
): Promise<'SUCCESSFUL' | ManageResponsesError> {
    if (!responseId || !isUuid(responseId)) return 'INVALID_RESPONSE_ID';
    try {
        const updated = await responseRepo.markAsReadById(responseId);
        return updated ? 'SUCCESSFUL' : 'NOT_FOUND';
    } catch {
        return 'OPERATION_FAILED';
    }
}

export async function DeleteResponseService(
    notificationRepo: NotificationRepository,
    responseRepo: PatientResponseRepository,
    responseId: string
): Promise<'SUCCESSFUL' | ManageResponsesError> {
    if (!responseId?.trim()) return 'INVALID_RESPONSE_ID';
    try {
        const messageId = await responseRepo.getMessageIdByResponseId(responseId);
        if (!messageId) return 'NOT_FOUND';
        const deletedResponse = await responseRepo.deleteById(responseId);
        if (!deletedResponse) return 'NOT_FOUND';
        await notificationRepo.deleteNotification(messageId);
        return 'SUCCESSFUL';
    } catch {
        return 'OPERATION_FAILED';
    }
}