import { SendWeeklyStats } from '../SendWeeklyStats';

describe('SendWeeklyStats Service', () => {
    const mockStatsRepo = { getAllPatientsStats: jest.fn() };
    const mockMailRepo = { send: jest.fn() };
    const mockNotificationRepo = {
        saveNotification: jest.fn(),
        getPendingCount: jest.fn()
    };

    const service = new SendWeeklyStats(
        mockStatsRepo as any,
        mockMailRepo as any,
        mockNotificationRepo as any
    );

    it('should execute successfully and send email with stats', async () => {
        const mockStats = [{
            id: 1,
            email: 'p1@t.com',
            sessions: [{ state: 'completed' }]
        }];

        mockStatsRepo.getAllPatientsStats.mockResolvedValue(mockStats);
        mockNotificationRepo.getPendingCount.mockResolvedValue(1);
        mockMailRepo.send.mockResolvedValue({ success: true });

        await service.execute();

        expect(mockNotificationRepo.saveNotification).toHaveBeenCalled();
        expect(mockMailRepo.send).toHaveBeenCalled();
    });
});