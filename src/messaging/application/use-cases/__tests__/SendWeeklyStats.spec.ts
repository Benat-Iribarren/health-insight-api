import { SendWeeklyStats } from '../SendWeeklyStats';

describe('SendWeeklyStats', () => {
    const mockStatsRepo = { getAllPatientsStats: jest.fn() };
    const mockMailRepo = { send: jest.fn() };
    const mockNotificationRepo = { getPendingCount: jest.fn() };
    const mockContactRepo = { getEmailByPatientId: jest.fn() };
    const mockTemplateProvider = { renderWeeklyStats: jest.fn().mockReturnValue('<html></html>') };

    const service = new SendWeeklyStats(
        mockStatsRepo as any,
        mockMailRepo as any,
        mockNotificationRepo as any,
        mockContactRepo as any,
        mockTemplateProvider as any
    );

    beforeAll(() => {
        (service as any).imageGenerator = {
            generateWeeklyDashboard: jest.fn().mockResolvedValue(Buffer.from(''))
        };
    });

    it('should execute fast without launching browser', async () => {
        mockStatsRepo.getAllPatientsStats.mockResolvedValue([{
            id: 1, email: 't@t.com', name: 'B', sessions: []
        }]);
        mockNotificationRepo.getPendingCount.mockResolvedValue(0);

        await service.execute();
        expect(mockMailRepo.send).toHaveBeenCalled();
    });
});