import { SupabaseNotificationRepository } from '../SupabaseNotificationRepository';

describe('Integration | SupabaseNotificationRepository', () => {
    const mockSupabase: any = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: jest.fn()
    };

    const repository = new SupabaseNotificationRepository(mockSupabase);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('saves a new notification and retrieves the list for a patient', async () => {
        mockSupabase.then
            .mockImplementationOnce((res: any) => res({ error: null }))
            .mockImplementationOnce((res: any) => res({ data: [{ id: '1', subject: 'Test Subject', content: 'Test Content', is_read: false }], error: null }));

        await repository.saveNotification(1, 'Test Subject', 'Test Content');
        const notifications = await repository.getPatientNotifications(1);

        expect(notifications.length).toBeGreaterThan(0);
        expect(notifications[0].subject).toBe('Test Subject');
    });

    it('retrieves a single notification detail', async () => {
        mockSupabase.then.mockImplementationOnce((res: any) => res({ data: { id: '1', patient_id: 1 }, error: null }));
        const detail = await repository.getNotificationDetail(1, '1');
        expect(detail).not.toBeNull();
    });

    it('returns null when retrieving a non-existent notification', async () => {
        mockSupabase.then.mockImplementationOnce((res: any) => res({ data: null, error: null }));
        const detail = await repository.getNotificationDetail(1, '0000');
        expect(detail).toBeNull();
    });

    it('marks a notification as read and updates pending count', async () => {
        mockSupabase.then
            .mockImplementationOnce((res: any) => res({ count: 1, error: null }))
            .mockImplementationOnce((res: any) => res({ error: null }));

        const count = await repository.getPendingCount(1);
        await repository.markAsRead(1, '1');

        expect(count).toBe(1);
    });

    it('deletes a notification correctly', async () => {
        mockSupabase.then.mockImplementationOnce((res: any) => res({ data: { id: '1' }, error: null }));
        const res = await repository.deleteNotification('1');
        expect(res).toBe(true);
    });

    it('returns 0 pending count for a patient with no notifications', async () => {
        mockSupabase.then.mockImplementationOnce((res: any) => res({ count: null, error: null }));
        const count = await repository.getPendingCount(99999);
        expect(count).toBe(0);
    });
});