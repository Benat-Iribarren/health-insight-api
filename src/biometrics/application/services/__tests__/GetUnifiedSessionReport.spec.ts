import { GetUnifiedSessionReportService } from '../GetUnifiedSessionReportService';

describe('Unit | GetUnifiedSessionReportService', () => {
    const mockRepo = {
        getFullSessionContext: jest.fn(),
        getBiometricData: jest.fn()
    };

    const service = new GetUnifiedSessionReportService(mockRepo as any);

    it('should return NO_DATA_FOUND if no sessions exist', async () => {
        mockRepo.getFullSessionContext.mockResolvedValue({ sessions: [], intervals: [], total: 0 });
        const result = await service.execute(1);
        expect(result).toBe('NO_DATA_FOUND');
    });

    it('should calculate report metrics correctly', async () => {
        mockRepo.getFullSessionContext.mockResolvedValue({
            sessions: [{ id: 101, state: 'completed', pre_evaluation: 3, post_evaluation: 7 }],
            intervals: [{ session_id: 101, context_type: 'session', start_minute_utc: '2026-01-01T10:00:00Z', end_minute_utc: '2026-01-01T10:10:00Z' }],
            total: 1
        });
        mockRepo.getBiometricData.mockResolvedValue([
            { timestamp_iso: '2026-01-01T10:05:00Z', pulse_rate_bpm: 80, eda_scl_usiemens: 1.5, temperature_celsius: 36.5 }
        ]);

        const result = await service.execute(1) as any;

        expect(result.data).toBeDefined();
        const reports = result.data;

        expect(Array.isArray(reports)).toBe(true);
        expect(reports[0].session_id).toBe('101');
        expect(reports[0].dizziness_percentage).toBeGreaterThan(0);
        expect(result.meta.total).toBe(1);
    });
});