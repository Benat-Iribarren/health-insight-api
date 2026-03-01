export interface Notification {
    id: string;
    patientId: number;
    subject: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    isDeleted: boolean;
}