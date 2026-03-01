import { RespondToNotificationService } from '../RespondToNotificationService';
import { invalidNotificationIdError, alreadyRespondedError, operationFailedError } from '../../types/RespondToNotificationError';

describe('Unit | RespondToNotificationService', () => {
    const makeResponseRepo = () => ({
        existsByMessageId: jest.fn(),
        create: jest.fn(),
    });

    const makeNotificationRepo = () => ({
        findByPatient: jest.fn(),
        markRead: jest.fn(),
    });

    test('returns INVALID_NOTIFICATION_ID when empty', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        const service = new RespondToNotificationService(responseRepo as any, notificationRepo as any);
        const res = await service.execute({ patientId: 1, messageId: '', subject: 'S' });

        expect(res).toBe(invalidNotificationIdError);
    });

    test('returns ALREADY_RESPONDED when already exists', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.existsByMessageId.mockResolvedValue(true);

        const service = new RespondToNotificationService(responseRepo as any, notificationRepo as any);
        const res = await service.execute({ patientId: 1, messageId: 'm1', subject: 'S' });

        expect(res).toBe(alreadyRespondedError);
    });

    test('returns INVALID_NOTIFICATION_ID when notification not found for patient', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.existsByMessageId.mockResolvedValue(false);
        notificationRepo.findByPatient.mockResolvedValue(null);

        const service = new RespondToNotificationService(responseRepo as any, notificationRepo as any);
        const res = await service.execute({ patientId: 1, messageId: 'm1', subject: 'S' });

        expect(res).toBe(invalidNotificationIdError);
    });

    test('creates response and marks read', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.existsByMessageId.mockResolvedValue(false);
        notificationRepo.findByPatient.mockResolvedValue({ id: 'm1', isRead: false });
        notificationRepo.markRead.mockResolvedValue(true);

        const service = new RespondToNotificationService(responseRepo as any, notificationRepo as any);
        const res = await service.execute({ patientId: 1, messageId: 'm1', subject: 'S' });

        expect(res).toBe('SUCCESSFUL');
        expect(responseRepo.create).toHaveBeenCalledWith({ patientId: 1, subject: 'S', messageId: 'm1' });
        expect(notificationRepo.markRead).toHaveBeenCalledWith(1, 'm1');
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.existsByMessageId.mockRejectedValue(new Error('boom'));

        const service = new RespondToNotificationService(responseRepo as any, notificationRepo as any);
        const res = await service.execute({ patientId: 1, messageId: 'm1', subject: 'S' });

        expect(res).toBe(operationFailedError);
    });
});