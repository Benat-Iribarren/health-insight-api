import { SendWeeklyStats } from '../SendWeeklyStats';
import { MESSAGING_RESPONSES } from '../../domain/MessagingError';

describe('SendWeeklyStats Service', () => {
    const mockStatsRepo = { getSessionsInRange: jest.fn() };
    const mockMailRepo = { send: jest.fn() };
    const mockImageGen = { generateWeeklyDashboard: jest.fn() };

    const service = new SendWeeklyStats(
        mockStatsRepo as any,
        mockMailRepo as any,
        mockImageGen as any
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return NO_STATS_DATA when no sessions exist', async () => {
        mockStatsRepo.getSessionsInRange.mockResolvedValue([]);
        const result = await service.execute();
        expect(result).toEqual({ type: MESSAGING_RESPONSES.ERRORS.NO_STATS_DATA.code });
    });

    test('should process patients correctly', async () => {
        const mockSessions = [{
            patient_id: 1, patient_name: 'P1', email: 'p1@t.com', state: 'completed', assigned_date: new Date().toISOString()
        }];
        mockStatsRepo.getSessionsInRange.mockResolvedValue(mockSessions);
        mockImageGen.generateWeeklyDashboard.mockResolvedValue(Buffer.from('img'));
        const result = await service.execute();
        expect(result).toEqual({ processed: 1 });
    });
});