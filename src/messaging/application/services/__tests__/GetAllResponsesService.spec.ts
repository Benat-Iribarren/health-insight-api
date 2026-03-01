import { GetAllResponsesService } from '../GetAllResponsesService';
import { operationFailedError } from '../../types/ManageResponsesError';

describe('Unit | GetAllResponsesService', () => {
    const makeResponseRepo = () => ({
        listAll: jest.fn(),
    });

    const makeNotificationRepo = () => ({
        getContentsByIds: jest.fn(),
    });

    test('returns empty list when no responses', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.listAll.mockResolvedValue([]);

        const service = new GetAllResponsesService(responseRepo as any, notificationRepo as any);
        const res = await service.execute();

        expect(res).toEqual([]);
        expect(notificationRepo.getContentsByIds).not.toHaveBeenCalled();
    });

    test('attaches message content', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.listAll.mockResolvedValue([
            { id: 'r1', messageId: 'm1', isRead: false, createdAt: 'x' },
            { id: 'r2', messageId: 'm2', isRead: true, createdAt: 'y' },
        ]);

        notificationRepo.getContentsByIds.mockResolvedValue({ m1: 'hello', m2: 'world' });

        const service = new GetAllResponsesService(responseRepo as any, notificationRepo as any);
        const res = await service.execute();

        expect(res).toEqual([
            { id: 'r1', messageId: 'm1', isRead: false, createdAt: 'x', message: 'hello' },
            { id: 'r2', messageId: 'm2', isRead: true, createdAt: 'y', message: 'world' },
        ]);
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const responseRepo = makeResponseRepo();
        const notificationRepo = makeNotificationRepo();

        responseRepo.listAll.mockRejectedValue(new Error('boom'));

        const service = new GetAllResponsesService(responseRepo as any, notificationRepo as any);
        const res = await service.execute();

        expect(res).toBe(operationFailedError);
    });
});