export type PatientResponse = {
    id: string;
    patient_id: number;
    subject: string;
    message_id: string;
    is_read: boolean;
    created_at: string;
};

export interface PatientResponseRepository {
    saveResponse(patientId: number, subject: string, messageId: string): Promise<void>;
    getAllResponses(): Promise<PatientResponse[]>;
    markAsReadById(responseId: string): Promise<boolean>;
    deleteById(responseId: string): Promise<boolean>;
    getMessageIdByResponseId(responseId: string): Promise<string | null>;
    existsByMessageId(messageId: string): Promise<boolean>;
}