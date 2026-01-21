import { NotificationRepository, Notification } from "../../domain/interfaces/NotificationRepository";

export class ManageNotifications {
    constructor(private readonly repo: NotificationRepository) {}

    async getUnreadCount(patientId: number): Promise<number> {
        return await this.repo.getPendingCount(patientId);
    }

    async getInbox(patientId: number): Promise<Notification[]> {
        return await this.repo.getPatientNotifications(patientId);
    }

    async readMessage(patientId: number, messageId: string): Promise<Notification | null> {
        const message = await this.repo.getNotificationDetail(patientId, messageId);
        if (message && message.is_read === false) {
            await this.repo.markAsRead(patientId, messageId);
        }
        return message;
    }

    async deleteMessage(patientId: number, messageId: string): Promise<void> {
        await this.repo.deleteNotification(patientId, messageId);
    }
}