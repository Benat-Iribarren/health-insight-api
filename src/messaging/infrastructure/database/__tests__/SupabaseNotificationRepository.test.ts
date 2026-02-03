import { SupabaseNotificationRepository } from '../SupabaseNotificationRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

describe('Integration | SupabaseNotificationRepository', () => {
    const repository = new SupabaseNotificationRepository(supabaseClient);

    it('saves a new notification and retrieves the list for a patient', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const subject = 'Test Subject';
        const content = 'Test Content';

        await repository.saveNotification(patientId, subject, content);
        const notifications = await repository.getPatientNotifications(patientId);

        expect(notifications.length).toBeGreaterThan(0);
        expect(notifications[0].subject).toBe(subject);
        expect(notifications[0].content).toBe(content);
        expect(notifications[0].is_read).toBe(false);
    });

    it('retrieves a single notification detail', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();

        const detail = await repository.getNotificationDetail(patientId, notificationId);

        expect(detail).not.toBeNull();
        expect(detail?.id).toBe(notificationId);
        expect(detail?.patient_id).toBe(patientId);
    });

    it('returns null when retrieving a non-existent notification', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const fakeId = '00000000-0000-0000-0000-000000000000';

        const detail = await repository.getNotificationDetail(patientId, fakeId);

        expect(detail).toBeNull();
    });

    it('marks a notification as read and updates pending count', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();
        const beforeCount = await repository.getPendingCount(patientId);

        await repository.markAsRead(patientId, notificationId);
        const afterCount = await repository.getPendingCount(patientId);

        expect(afterCount).toBe(beforeCount - 1);
    });

    it('deletes a notification correctly', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();

        await repository.deleteNotification(patientId, notificationId);
        const detail = await repository.getNotificationDetail(patientId, notificationId);

        expect(detail).toBeNull();
    });

    it('returns 0 pending count for a patient with no notifications', async () => {
        await initMessagingTestDatabase();
        const unusedPatientId = 99999;

        const count = await repository.getPendingCount(unusedPatientId);

        expect(count).toBe(0);
    });
});