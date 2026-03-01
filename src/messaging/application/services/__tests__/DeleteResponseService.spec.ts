import { DeleteResponseService } from '../DeleteResponseService';
import { invalidResponseIdError, notFoundError, operationFailedError } from '../../types/ManageResponsesError';

describe('Unit | DeleteResponseService', () => {
    const makeResponseRepo = () => ({
        getMessageIdByResponseId: jest.fn(),
        deleteById: jest.fn(),
    });

    const makeNotificationRepo = () => ({
        hardDelete: jest.fn(),
    });

    test('returns INVALID_RESPONSE_ID when empty', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        const service = new DeleteResponseService(responseRepo as any, notificationRepo as any);
        const res = await service.execute('');

        expect(res).toBe(invalidResponseIdError);
    });

    test('returns INVALID_RESPONSE_ID when not uuid', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        const service = new DeleteResponseService(responseRepo as any, notificationRepo as any);
        const res = await service.execute('nope');

        expect(res).toBe(invalidResponseIdError);
    });

    test('returns NOT_FOUND when messageId missing', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.getMessageIdByResponseId.mockResolvedValue(null);

        const service = new DeleteResponseService(responseRepo as any, notificationRepo as any);
        const res = await service.execute('123e4567-e89b-12d3-a456-426614174000');

        expect(res).toBe(notFoundError);
    });

    test('returns NOT_FOUND when deleteById false', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.getMessageIdByResponseId.mockResolvedValue('m1');
        responseRepo.deleteById.mockResolvedValue(false);

        const service = new DeleteResponseService(responseRepo as any, notificationRepo as any);
        const res = await service.execute('123e4567-e89b-12d3-a456-426614174000');

        expect(res).toBe(notFoundError);
        expect(notificationRepo.hardDelete).not.toHaveBeenCalled();
    });

    test('returns SUCCESSFUL when deleted and hardDelete called', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.getMessageIdByResponseId.mockResolvedValue('m1');
        responseRepo.deleteById.mockResolvedValue(true);
        notificationRepo.hardDelete.mockResolvedValue(true);

        const service = new DeleteResponseService(responseRepo as any, notificationRepo as any);
        const res = await service.execute('123e4567-e89b-12d3-a456-426614174000');

        expect(res).toBe('SUCCESSFUL');
        expect(notificationRepo.hardDelete).toHaveBeenCalledWith('m1');
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.getMessageIdByResponseId.mockRejectedValue(new Error('boom'));

        const service = new DeleteResponseService(responseRepo as any, notificationRepo as any);
        const res = await service.execute('123e4567-e89b-12d3-a456-426614174000');

        expect(res).toBe(operationFailedError);
    });
});