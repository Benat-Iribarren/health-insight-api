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

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should execute successfully and send email with stats', async () => {
        const mockStats = [{
            id: 1,
            email: 'p1@t.com',
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            sessions: [{ state: 'completed' }]
        }];

        mockStatsRepo.getAllPatientsStats.mockResolvedValue(mockStats);
        mockNotificationRepo.getPendingCount.mockResolvedValue(3);
        mockMailRepo.send.mockResolvedValue({ success: true });

        await service.execute();

        expect(mockStatsRepo.getAllPatientsStats).toHaveBeenCalled();
        expect(mockNotificationRepo.saveNotification).toHaveBeenCalledWith(
            1,
            "Tu resumen semanal de salud",
            "Aquí tienes tus estadísticas de la semana."
        );
        expect(mockMailRepo.send).toHaveBeenCalledWith('p1@t.com', expect.any(String), expect.any(String), 3, expect.any(Object));
    });

    it('should throw error when stats retrieval fails', async () => {
        mockStatsRepo.getAllPatientsStats.mockRejectedValue(new Error('DB_ERROR'));

        await expect(service.execute()).rejects.toThrow('DB_ERROR');
        expect(mockMailRepo.send).not.toHaveBeenCalled();
    });
});