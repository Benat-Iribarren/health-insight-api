import { SendWeeklyStats } from '../SendWeeklyStats';

describe('SendWeeklyStats Service', () => {
    const mockStatsRepo = { getPatientStats: jest.fn() };
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
        const mockStats = {
            email: 'p1@t.com',
            completed: 5,
            inProgress: 2,
            notStarted: 1
        };

        mockStatsRepo.getPatientStats.mockResolvedValue(mockStats);
        mockNotificationRepo.getPendingCount.mockResolvedValue(3);
        mockMailRepo.send.mockResolvedValue({ success: true });

        await service.execute(1);

        expect(mockStatsRepo.getPatientStats).toHaveBeenCalledWith(1);
        expect(mockNotificationRepo.saveNotification).toHaveBeenCalledWith(
            1,
            "Tu resumen semanal de salud",
            "Aquí tienes tus estadísticas de la semana."
        );
        expect(mockMailRepo.send).toHaveBeenCalledWith('p1@t.com', expect.any(String), expect.any(String), 3);
    });

    it('should throw error when stats retrieval fails', async () => {
        mockStatsRepo.getPatientStats.mockRejectedValue(new Error('DB_ERROR'));

        await expect(service.execute(1)).rejects.toThrow('DB_ERROR');
        expect(mockMailRepo.send).not.toHaveBeenCalled();
    });
});