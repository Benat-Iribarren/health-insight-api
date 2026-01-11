import { SendWeeklyStats } from '../SendWeeklyStats';
import { MESSAGING_RESPONSES } from '../../domain/MessagingError';

describe('SendWeeklyStats Service', () => {
    const mockStatsRepo = { getSessionsInRange: jest.fn() };
    const mockMailRepo = { send: jest.fn() };
    const mockImageGen = { generateWeeklyDashboard: jest.fn() };

    const service = new SendWeeklyStats(
        mockStatsRepo as any,
        mockMailRepo as any
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return NO_STATS_DATA when no sessions exist', async () => {
        mockStatsRepo.getSessionsInRange.mockResolvedValue([]);
        const result = await service.execute();
        expect(result).toEqual({ type: MESSAGING_RESPONSES.ERRORS.NO_STATS_DATA.code });
    });

    it('should process patients correctly', async () => {
        const mockSessions = [{
            patient_id: 1,
            patient_name: 'P1',
            email: 'p1@t.com',
            state: 'completed',
            assigned_date: new Date().toISOString()
        }];

        mockStatsRepo.getSessionsInRange.mockResolvedValue(mockSessions);
        mockImageGen.generateWeeklyDashboard.mockResolvedValue(Buffer.from('img'));
        mockMailRepo.send.mockResolvedValue({ success: true });

        const result = await service.execute();

        expect(result).toEqual({ processed: 1 });
    });

    it('should return MAIL_FAILURE when email sending fails', async () => {
        const mockSessions = [{
            patient_id: 1,
            patient_name: 'P1',
            email: 'p1@t.com',
            state: 'completed',
            assigned_date: new Date().toISOString()
        }];

        mockStatsRepo.getSessionsInRange.mockResolvedValue(mockSessions);
        mockImageGen.generateWeeklyDashboard.mockResolvedValue(Buffer.from('img'));
        mockMailRepo.send.mockResolvedValue({ success: false });

        const result = await service.execute();

        expect(result).toEqual({ type: MESSAGING_RESPONSES.ERRORS.MAIL_FAILURE.code });
    });
});