import { Response } from '../models/Response';

export interface ResponseRepository {
    create(input: { patientId: number; subject: string; messageId: string }): Promise<void>;
    listAll(): Promise<Response[]>;
    markReadById(responseId: string): Promise<boolean>;
    deleteById(responseId: string): Promise<boolean>;
    getMessageIdByResponseId(responseId: string): Promise<string | null>;
    existsByMessageId(messageId: string): Promise<boolean>;
}