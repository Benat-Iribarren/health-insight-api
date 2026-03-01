import { Response } from '../models/Response';

export type MessageContentsById = Record<string, string>;

export const attachMessageContent = <T extends Pick<Response, 'messageId'>>(
    responses: T[],
    contentsById: MessageContentsById
): (T & { message: string })[] =>
    responses.map((r) => ({
        ...r,
        message: contentsById[r.messageId] || '',
    }));

export const shouldCascadeDeleteNotificationWhenDeletingResponse = (): boolean => true;