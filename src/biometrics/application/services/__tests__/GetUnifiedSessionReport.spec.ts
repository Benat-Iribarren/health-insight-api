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
            sessions: [{ sessionId: 101, state: 'completed', preEvaluation: 3, postEvaluation: 7, assignedDate: null }],
            intervals: [{ sessionId: 101, contextType: 'session', startMinuteUtc: new Date('2026-01-01T10:00:00Z'), endMinuteUtc: new Date('2026-01-01T10:10:00Z') }],
            total: 1
        });
        mockRepo.getBiometricData.mockResolvedValue([
            { timestamp: new Date('2026-01-01T10:05:00Z'), pulseRateBpm: 80, edaSclUsiemens: 1.5, temperatureCelsius: 36.5, accelStdG: null, respiratoryRateBrpm: null, bodyPositionType: null }
        ]);

        const result = await service.execute(1) as any;

        expect(result.data).toBeDefined();
        const reports = result.data;

        expect(Array.isArray(reports)).toBe(true);
        expect(reports[0].sessionId).toBe('101');
        expect(reports[0].dizzinessPercentage).toBeGreaterThan(0);
        expect(result.meta.total).toBe(1);
    });
});