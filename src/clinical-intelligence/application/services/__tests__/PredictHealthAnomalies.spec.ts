import { processDropoutAnalysisService } from '../DropoutAnalysisService';
import { DropoutRepository } from '../../../domain/interfaces/DropoutRepository';
import { noDataError, analysisFailedError } from '../../types/PredictDropoutError';

describe('Unit | processDropoutAnalysis', () => {
    let mockRepository: jest.Mocked<DropoutRepository>;

    beforeEach(() => {
        mockRepository = {
            getPatientSessionData: jest.fn(),
        };
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns NO_DATA when repository returns empty array', async () => {
        mockRepository.getPatientSessionData.mockResolvedValue([]);

        const result = await processDropoutAnalysisService(mockRepository);

        expect(result).toBe(noDataError);
        expect(mockRepository.getPatientSessionData).toHaveBeenCalledWith(undefined);
    });

    it('returns ANALYSIS_FAILED when repository throws', async () => {
        mockRepository.getPatientSessionData.mockRejectedValue(new Error('db down'));

        const result = await processDropoutAnalysisService(mockRepository);

        expect(result).toBe(analysisFailedError);
    });

    it('passes patientId to repository when provided', async () => {
        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 1,
                name: 'Test Patient',
                sessionId: 10,
                assignedDate: new Date().toISOString(),
                sessionStatus: 'completed',
                sessionUpdate: null,
                postEval: 0,
            },
        ]);

        await processDropoutAnalysisService(mockRepository, 1);

        expect(mockRepository.getPatientSessionData).toHaveBeenCalledWith(1);
    });

    it('adds overdue calendar factor and increases riskScore by 50', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-25T12:00:00.000Z'));

        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 1,
                name: 'Test Patient',
                sessionId: 10,
                assignedDate: '2026-01-20T12:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
        ]);

        const result = await processDropoutAnalysisService(mockRepository);

        expect(Array.isArray(result)).toBe(true);
        if (!Array.isArray(result)) return;

        expect(result[0].patientId).toBe('1');
        expect(result[0].riskScore).toBe(50);
        expect(result[0].factors).toContain('Retraso en calendario');
        expect(result[0].status).toBe('MODERATE');
    });

    it('adds dizziness factor from last completed session and increases riskScore by 20', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-25T12:00:00.000Z'));

        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 2,
                name: 'Dizzy Patient',
                sessionId: 20,
                assignedDate: '2026-01-10T10:00:00.000Z',
                sessionStatus: 'completed',
                sessionUpdate: null,
                postEval: 9,
            },
            {
                patientId: 2,
                name: 'Dizzy Patient',
                sessionId: 21,
                assignedDate: '2026-01-27T12:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
        ]);

        const result = await processDropoutAnalysisService(mockRepository);

        expect(Array.isArray(result)).toBe(true);
        if (!Array.isArray(result)) return;

        expect(result[0].patientId).toBe('2');
        expect(result[0].factors).toContain('Mareo elevado en ultima sesion');
        expect(result[0].riskScore).toBe(20);
        expect(result[0].status).toBe('LOW');
    });

    it('applies buffer bonus (-30) when next session is more than 7 days ahead and clamps to 0', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-25T00:00:00.000Z'));

        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 3,
                name: 'Buffered Patient',
                sessionId: 30,
                assignedDate: '2026-02-10T00:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
        ]);

        const result = await processDropoutAnalysisService(mockRepository);

        expect(Array.isArray(result)).toBe(true);
        if (!Array.isArray(result)) return;

        expect(result[0].patientId).toBe('3');
        expect(result[0].riskScore).toBe(0);
        expect(result[0].status).toBe('LOW');
        expect(result[0].factors).toEqual([]);
        expect(result[0].bufferDays).toBeGreaterThan(7);
    });

    it('calculates bufferDays as ceil(dayDiff) relative to now', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-25T12:00:00.000Z'));

        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 4,
                name: 'Buffer Days Patient',
                sessionId: 40,
                assignedDate: '2026-01-27T13:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
        ]);

        const result = await processDropoutAnalysisService(mockRepository);

        expect(Array.isArray(result)).toBe(true);
        if (!Array.isArray(result)) return;

        expect(result[0].patientId).toBe('4');
        expect(result[0].bufferDays).toBe(3);
    });

    it('groups sessions by patient and returns one risk per patient', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-25T12:00:00.000Z'));

        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 5,
                name: 'Same Patient',
                sessionId: 50,
                assignedDate: '2026-01-10T10:00:00.000Z',
                sessionStatus: 'completed',
                sessionUpdate: null,
                postEval: 0,
            },
            {
                patientId: 5,
                name: 'Same Patient',
                sessionId: 51,
                assignedDate: '2026-01-30T10:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
            {
                patientId: 6,
                name: 'Other Patient',
                sessionId: 60,
                assignedDate: '2026-01-20T10:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
        ]);

        const result = await processDropoutAnalysisService(mockRepository);

        expect(Array.isArray(result)).toBe(true);
        if (!Array.isArray(result)) return;

        const ids = result.map((r) => r.patientId).sort();
        expect(ids).toEqual(['5', '6']);
    });

    it('sorts results by riskScore descending', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-01-25T12:00:00.000Z'));

        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 10,
                name: 'Low Risk',
                sessionId: 100,
                assignedDate: '2026-02-10T12:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
            {
                patientId: 11,
                name: 'High Risk',
                sessionId: 110,
                assignedDate: '2026-01-10T12:00:00.000Z',
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0,
            },
        ]);

        const result = await processDropoutAnalysisService(mockRepository);

        expect(Array.isArray(result)).toBe(true);
        if (!Array.isArray(result)) return;

        expect(result[0].patientId).toBe('11');
        expect(result[1].patientId).toBe('10');
        expect(result[0].riskScore).toBeGreaterThanOrEqual(result[1].riskScore);
    });
});
