import { NotificationRepository, Notification } from '../../domain/interfaces/NotificationRepository';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

type NotificationRow = {
    id: string;
    patient_id: number;
    subject: string;
    content: string;
    is_read: boolean;
    created_at: string;
    is_deleted: boolean;
};

export class SupabaseNotificationRepository implements NotificationRepository {
    constructor(private readonly supabase: DBClientService) {}

    async saveNotification(patientId: number, subject: string, content: string): Promise<void> {
        const { error } = await this.supabase.from('PatientNotifications').insert({
            patient_id: patientId,
            subject,
            content,
            is_read: false,
        });
        if (error) throw error;
    }

    async getPatientNotifications(patientId: number): Promise<Notification[]> {
        const { data, error } = await this.supabase
            .from('PatientNotifications')
            .select('id, patient_id, subject, content, is_read, created_at, is_deleted')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return ((data ?? []) as NotificationRow[]) as Notification[];
    }

    async getNotificationDetail(patientId: number, notificationId: string): Promise<Notification | null> {
        const { data, error } = await this.supabase
            .from('PatientNotifications')
            .select('id, patient_id, subject, content, is_read, created_at')
            .eq('id', notificationId)
            .eq('patient_id', patientId)
            .maybeSingle();
        if (error) throw error;
        return (data as NotificationRow | null) as Notification | null;
    }

    async getNotificationContents(notificationIds: string[]): Promise<Record<string, string>> {
        if (notificationIds.length === 0) return {};
        const { data, error } = await this.supabase
            .from('PatientNotifications')
            .select('id, content')
            .in('id', notificationIds);
        if (error) throw error;
        const map: Record<string, string> = {};
        data?.forEach((row: { id: string, content: string }) => { map[row.id] = row.content; });
        return map;
    }

    async markAsRead(patientId: number, notificationId: string): Promise<void> {
        const { error } = await this.supabase
            .from('PatientNotifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('patient_id', patientId);
        if (error) throw error;
    }

    async markNotificationAsDeleted(patientId: number, notificationId: string): Promise<void> {
        const { error } = await this.supabase
            .from('PatientNotifications')
            .update({ is_deleted: true })
            .eq('id', notificationId)
            .eq('patient_id', patientId);
        if (error) throw error;
    }

    async getPendingCount(patientId: number): Promise<number> {
        const { count, error } = await this.supabase
            .from('PatientNotifications')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
            .eq('is_read', false);
        if (error) throw error;
        return count ?? 0;
    }

    async deleteNotification(notificationId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('PatientNotifications')
            .delete()
            .eq('id', notificationId)
            .select('id')
            .maybeSingle();
        if (error) throw error;
        return !!data;
    }
}