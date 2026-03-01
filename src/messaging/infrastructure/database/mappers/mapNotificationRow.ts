import { Notification } from '../../../domain/models/Notification';

export type NotificationRow = {
    id: string;
    patient_id: number;
    subject: string;
    content: string;
    is_read: boolean;
    created_at: string;
    is_deleted: boolean;
};

export function mapNotificationRow(r: NotificationRow): Notification {
    return {
        id: String(r.id),
        patientId: Number(r.patient_id),
        subject: String(r.subject),
        content: String(r.content),
        isRead: Boolean(r.is_read),
        createdAt: String(r.created_at),
        isDeleted: Boolean(r.is_deleted),
    };
}

export function mapNotificationInsert(m: { patientId: number; subject: string; content: string }) {
    return {
        patient_id: m.patientId,
        subject: m.subject,
        content: m.content,
        is_read: false,
        is_deleted: false,
    };
}