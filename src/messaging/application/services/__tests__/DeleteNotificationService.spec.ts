import { DeleteNotificationService } from '../DeleteNotificationService';
import { invalidNotificationIdError, notFoundError, operationFailedError } from '../../types/ManageNotificationsError';

describe('Unit | DeleteNotificationService', () => {
    const makeRepo = () => ({
        softDelete: jest.fn(),
    });

    test('returns INVALID_NOTIFICATION_ID when missing', async () => {
        const repo = makeRepo();
        const service = new DeleteNotificationService(repo as any);

        const res = await service.execute({ patientId: 1, notificationId: '' });
        expect(res).toBe(invalidNotificationIdError);
    });

    test('returns NOT_FOUND when repo returns false', async () => {
        const repo = makeRepo();
        repo.softDelete.mockResolvedValue(false);

        const service = new DeleteNotificationService(repo as any);
        const res = await service.execute({ patientId: 1, notificationId: 'n1' });

        expect(res).toBe(notFoundError);
    });

    test('returns SUCCESSFUL when repo returns true', async () => {
        const repo = makeRepo();
        repo.softDelete.mockResolvedValue(true);

        const service = new DeleteNotificationService(repo as any);
        const res = await service.execute({ patientId: 1, notificationId: 'n1' });

        expect(res).toBe('SUCCESSFUL');
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const repo = makeRepo();
        repo.softDelete.mockRejectedValue(new Error('boom'));

        const service = new DeleteNotificationService(repo as any);
        const res = await service.execute({ patientId: 1, notificationId: 'n1' });

        expect(res).toBe(operationFailedError);
    });
});