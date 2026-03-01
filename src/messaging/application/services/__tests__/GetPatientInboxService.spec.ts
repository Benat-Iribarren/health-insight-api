import { GetPatientInboxService } from '../GetPatientInboxService';
import { operationFailedError } from '../../types/ManageNotificationsError';

describe('Unit | GetPatientInboxService', () => {
    const makeRepo = () => ({
        listByPatient: jest.fn(),
    });

    test('returns list on success', async () => {
        const repo = makeRepo();
        repo.listByPatient.mockResolvedValue([{ id: 'n1' }]);

        const service = new GetPatientInboxService(repo as any);
        const res = await service.execute(1);

        expect(Array.isArray(res)).toBe(true);
        expect(repo.listByPatient).toHaveBeenCalledWith(1);
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const repo = makeRepo();
        repo.listByPatient.mockRejectedValue(new Error('boom'));

        const service = new GetPatientInboxService(repo as any);
        const res = await service.execute(1);

        expect(res).toBe(operationFailedError);
    });
});