import { Response } from '../../../domain/models/Response';

export type ResponseRow = {
    id: string;
    patient_id: number;
    subject: string;
    message_id: string;
    is_read: boolean;
    created_at: string;
};

export function mapResponseRow(r: ResponseRow): Response {
    return {
        id: String(r.id),
        patientId: Number(r.patient_id),
        subject: String(r.subject),
        messageId: String(r.message_id),
        isRead: Boolean(r.is_read),
        createdAt: String(r.created_at),
    };
}

export function mapResponseInsert(m: { patientId: number; subject: string; messageId: string }) {
    return {
        patient_id: m.patientId,
        subject: m.subject,
        message_id: m.messageId,
        is_read: false,
    };
}