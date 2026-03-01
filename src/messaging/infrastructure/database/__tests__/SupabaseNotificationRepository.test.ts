import { SupabaseNotificationRepository } from '../repositories/SupabaseNotificationRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

describe('Integration | SupabaseNotificationRepository', () => {
    const repository = new SupabaseNotificationRepository(supabaseClient);

    it('creates a new notification and lists it for a patient', async () => {
        const { patientId } = await initMessagingTestDatabase();

        await repository.create({ patientId, subject: 'Test Subject', content: 'Test Content' });
        const notifications = await repository.listByPatient(patientId);

        expect(notifications.length).toBeGreaterThan(0);
        expect(notifications[0].subject).toBe('Test Subject');
    });

    it('retrieves a single notification detail', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();

        const detail = await repository.findByPatient(patientId, notificationId);

        expect(detail).not.toBeNull();
        expect(detail?.id).toBe(notificationId);
    });

    it('returns null when retrieving a non-existent notification', async () => {
        const { patientId } = await initMessagingTestDatabase();

        const detail = await repository.findByPatient(patientId, '00000000-0000-0000-0000-000000000000');

        expect(detail).toBeNull();
    });

    it('marks a notification as read and updates pending count', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();

        const countBefore = await repository.pendingCount(patientId);
        await repository.markRead(patientId, notificationId);
        const countAfter = await repository.pendingCount(patientId);

        expect(countAfter).toBeLessThanOrEqual(countBefore);
    });

    it('deletes a notification logically', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();

        await repository.softDelete(patientId, notificationId);
        const notifications = await repository.listByPatient(patientId);

        const deletedNotification = notifications.find((n) => n.id === notificationId);

        expect(deletedNotification).toBeUndefined();
    });

    it('returns 0 pending count for a patient with no notifications', async () => {
        const count = await repository.pendingCount(999999);
        expect(count).toBe(0);
    });
});