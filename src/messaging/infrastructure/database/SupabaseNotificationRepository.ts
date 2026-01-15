import { NotificationRepository, Notification } from '../../domain/interfaces/NotificationRepository';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

export class SupabaseNotificationRepository implements NotificationRepository {
    constructor(private readonly supabase: DBClientService) {}

    async saveNotification(patientId: number, subject: string, content: string): Promise<void> {
        await this.supabase
            .from('patientnotifications')
            .insert({
                patient_id: patientId,
                subject: subject,
                content: content,
                is_read: false
            });
    }

    async getPendingCount(patientId: number): Promise<number> {
        const { count } = await this.supabase
            .from('patientnotifications')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
            .eq('is_read', false);
        return count || 0;
    }

    async getPatientNotifications(patientId: number): Promise<Notification[]> {
        const { data } = await this.supabase
            .from('patientnotifications')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        return (data as Notification[]) || [];
    }

    async getNotificationDetail(patientId: number, notificationId: string): Promise<Notification | null> {
        const { data } = await this.supabase
            .from('patientnotifications')
            .select('*')
            .eq('id', notificationId)
            .eq('patient_id', patientId)
            .maybeSingle();
        return (data as Notification) || null;
    }

    async markAsRead(patientId: number, notificationId: string): Promise<void> {
        await this.supabase
            .from('patientnotifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('patient_id', patientId);
    }

    async deleteNotification(patientId: number, notificationId: string): Promise<void> {
        await this.supabase
            .from('patientnotifications')
            .delete()
            .eq('id', notificationId)
            .eq('patient_id', patientId);
    }
}