import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { Notification } from '../../../domain/models/Notification';
import { NotificationRow, mapNotificationInsert, mapNotificationRow } from '../mappers/mapNotificationRow';

export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: { patientId: number; subject: string; content: string }): Promise<void> {
    const { error } = await this.client.from('Notifications').insert(mapNotificationInsert(input));
    if (error) throw error;
  }

  async listByPatient(patientId: number): Promise<Notification[]> {
    const { data, error } = await this.client
        .from('Notifications')
        .select('id, patient_id, subject, content, is_read, created_at, is_deleted')
        .eq('patient_id', patientId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data as unknown as NotificationRow[]) || []).map(mapNotificationRow);
  }

  async findByPatient(patientId: number, notificationId: string): Promise<Notification | null> {
    const { data, error } = await this.client
        .from('Notifications')
        .select('id, patient_id, subject, content, is_read, created_at, is_deleted')
        .eq('patient_id', patientId)
        .eq('id', notificationId)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapNotificationRow(data as unknown as NotificationRow);
  }

  async markRead(patientId: number, notificationId: string): Promise<boolean> {
    const { data, error } = await this.client
        .from('Notifications')
        .update({ is_read: true })
        .eq('patient_id', patientId)
        .eq('id', notificationId)
        .select('id')
        .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async softDelete(patientId: number, notificationId: string): Promise<boolean> {
    const { data, error } = await this.client
        .from('Notifications')
        .update({ is_deleted: true })
        .eq('patient_id', patientId)
        .eq('id', notificationId)
        .select('id')
        .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async hardDelete(notificationId: string): Promise<boolean> {
    const { error, count } = await this.client
        .from('Notifications')
        .delete({ count: 'exact' })
        .eq('id', notificationId);

    if (error) throw error;
    return (count || 0) > 0;
  }

  async pendingCount(patientId: number): Promise<number> {
    const { count, error } = await this.client
        .from('Notifications')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('is_deleted', false)
        .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  async getContentsByIds(notificationIds: string[]): Promise<Record<string, string>> {
    if (notificationIds.length === 0) return {};

    const { data, error } = await this.client.from('Notifications').select('id, content').in('id', notificationIds);
    if (error) throw error;

    const out: Record<string, string> = {};
    for (const r of (data as any[]) || []) out[String(r.id)] = String(r.content ?? '');
    return out;
  }
}