import { Notification } from '../models/Notification';

export interface NotificationRepository {
    create(input: { patientId: number; subject: string; content: string }): Promise<void>;
    listByPatient(patientId: number): Promise<Notification[]>;
    findByPatient(patientId: number, notificationId: string): Promise<Notification | null>;
    markRead(patientId: number, notificationId: string): Promise<boolean>;
    softDelete(patientId: number, notificationId: string): Promise<boolean>;
    hardDelete(notificationId: string): Promise<boolean>;
    pendingCount(patientId: number): Promise<number>;
    getContentsByIds(notificationIds: string[]): Promise<Record<string, string>>;
}