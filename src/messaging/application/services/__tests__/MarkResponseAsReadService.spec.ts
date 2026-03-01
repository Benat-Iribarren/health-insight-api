import { MarkResponseAsReadService } from '../MarkResponseAsReadService';
import { invalidResponseIdError, notFoundError, operationFailedError } from '../../types/ManageResponsesError';

describe('Unit | MarkResponseAsReadService', () => {
    const makeRepo = () => ({
        markReadById: jest.fn(),
    });

    test('returns INVALID_RESPONSE_ID when empty', async () => {
        const repo = makeRepo();
        const service = new MarkResponseAsReadService(repo as any);

        const res = await service.execute('');
        expect(res).toBe(invalidResponseIdError);
    });

    test('returns INVALID_RESPONSE_ID when not uuid', async () => {
        const repo = makeRepo();
        const service = new MarkResponseAsReadService(repo as any);

        const res = await service.execute('nope');
        expect(res).toBe(invalidResponseIdError);
    });

    test('returns NOT_FOUND when repo false', async () => {
        const repo = makeRepo();
        repo.markReadById.mockResolvedValue(false);

        const service = new MarkResponseAsReadService(repo as any);
        const res = await service.execute('123e4567-e89b-12d3-a456-426614174000');

        expect(res).toBe(notFoundError);
    });

    test('returns SUCCESSFUL when repo true', async () => {
        const repo = makeRepo();
        repo.markReadById.mockResolvedValue(true);

        const service = new MarkResponseAsReadService(repo as any);
        const res = await service.execute('123e4567-e89b-12d3-a456-426614174000');

        expect(res).toBe('SUCCESSFUL');
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const repo = makeRepo();
        repo.markReadById.mockRejectedValue(new Error('boom'));

        const service = new MarkResponseAsReadService(repo as any);
        const res = await service.execute('123e4567-e89b-12d3-a456-426614174000');

        expect(res).toBe(operationFailedError);
    });
});