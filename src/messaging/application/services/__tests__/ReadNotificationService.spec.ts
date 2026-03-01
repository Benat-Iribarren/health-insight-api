import { ReadNotificationService } from '../ReadNotificationService';
import { invalidNotificationIdError, notFoundError, operationFailedError } from '../../types/ManageNotificationsError';

describe('Unit | ReadNotificationService', () => {
    const makeRepo = () => ({
        findByPatient: jest.fn(),
        markRead: jest.fn(),
    });

    test('returns INVALID_NOTIFICATION_ID when missing', async () => {
        const repo = makeRepo();
        const service = new ReadNotificationService(repo as any);

        const res = await service.execute({ patientId: 1, notificationId: '' });
        expect(res).toBe(invalidNotificationIdError);
    });

    test('returns NOT_FOUND when not exists', async () => {
        const repo = makeRepo();
        repo.findByPatient.mockResolvedValue(null);

        const service = new ReadNotificationService(repo as any);
        const res = await service.execute({ patientId: 1, notificationId: 'n1' });

        expect(res).toBe(notFoundError);
    });

    test('marks read when unread', async () => {
        const repo = makeRepo();
        repo.findByPatient.mockResolvedValue({ id: 'n1', isRead: false });
        repo.markRead.mockResolvedValue(true);

        const service = new ReadNotificationService(repo as any);
        const res = await service.execute({ patientId: 1, notificationId: 'n1' });

        expect(res).toEqual({ id: 'n1', isRead: true });
        expect(repo.markRead).toHaveBeenCalledWith(1, 'n1');
    });

    test('returns OPERATION_FAILED when markRead fails', async () => {
        const repo = makeRepo();
        repo.findByPatient.mockResolvedValue({ id: 'n1', isRead: false });
        repo.markRead.mockResolvedValue(false);

        const service = new ReadNotificationService(repo as any);
        const res = await service.execute({ patientId: 1, notificationId: 'n1' });

        expect(res).toBe(operationFailedError);
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const repo = makeRepo();
        repo.findByPatient.mockRejectedValue(new Error('boom'));

        const service = new ReadNotificationService(repo as any);
        const res = await service.execute({ patientId: 1, notificationId: 'n1' });

        expect(res).toBe(operationFailedError);
    });
});