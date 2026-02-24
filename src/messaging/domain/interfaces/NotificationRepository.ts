export interface Notification {
    id: string;
    patient_id: number;
    subject: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface NotificationRepository {
    saveNotification(patientId: number, subject: string, content: string): Promise<void>;
    getPatientNotifications(patientId: number): Promise<Notification[]>;
    getNotificationDetail(patientId: number, notificationId: string): Promise<Notification | null>;
    markAsRead(patientId: number, notificationId: string): Promise<void>;
    markNotificationAsDeleted(patientId: number, notificationId: string): Promise<void>;
    deleteNotification(notificationId: string): Promise<boolean>;
    getPendingCount(patientId: number): Promise<number>;
}
