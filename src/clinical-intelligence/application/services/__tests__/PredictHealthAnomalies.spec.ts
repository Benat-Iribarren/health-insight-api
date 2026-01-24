import { DropoutAnalysisService } from '../DropoutAnalysisService';
import { DropoutRepository } from '../../../domain/interfaces/DropoutRepository';
import { DropoutRisk } from '../../../domain/models/DropoutRisk';

describe('DropoutAnalysisService', () => {
    let service: DropoutAnalysisService;
    let mockRepository: jest.Mocked<DropoutRepository>;

    beforeEach(() => {
        mockRepository = {
            getPatientSessionData: jest.fn()
        };
        service = new DropoutAnalysisService(mockRepository);
        jest.clearAllMocks();
    });

    it('should return NO_DATA code when no patient data is found', async () => {
        mockRepository.getPatientSessionData.mockResolvedValue([]);

        const result = await service.execute();

        // Comprobamos que devuelve el objeto de error esperado
        expect(result).toHaveProperty('type');
    });

    it('should identify a CRITICAL risk for patients with overdue calendars', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        mockRepository.getPatientSessionData.mockResolvedValue([{
            patientId: 'p1',
            name: 'Test Patient',
            sessionId: 's1',
            assignedDate: pastDate.toISOString(),
            sessionStatus: 'assigned',
            sessionUpdate: null,
            postEval: 0
        }]);

        const result = await service.execute('p1');

        if (Array.isArray(result)) {
            expect(result[0].patientId).toBe('p1');
            expect(result[0].riskScore).toBeGreaterThanOrEqual(50);
            expect(result[0].factors).toContain('Retraso en calendario');
        } else {
            fail('Result should be an array');
        }
    });

    it('should identify dizziness in last session as a risk factor', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);

        mockRepository.getPatientSessionData.mockResolvedValue([
            {
                patientId: 'p2',
                name: 'Dizzy Patient',
                sessionId: 's1',
                assignedDate: new Date().toISOString(),
                sessionStatus: 'completed',
                sessionUpdate: null,
                postEval: 9
            },
            {
                patientId: 'p2',
                name: 'Dizzy Patient',
                sessionId: 's2',
                assignedDate: futureDate.toISOString(),
                sessionStatus: 'assigned',
                sessionUpdate: null,
                postEval: 0
            }
        ]);

        const result = await service.execute();

        if (Array.isArray(result)) {
            expect(result[0].factors).toContain('Mareo elevado en ultima sesion');
            expect(result[0].riskScore).toBe(20);
            expect(result[0].status).toBe('LOW');
        } else {
            fail('Result should be an array');
        }
    });

    it('should detect stale in-progress sessions as a significant risk', async () => {
        const oldUpdate = new Date();
        oldUpdate.setHours(oldUpdate.getHours() - 30);

        mockRepository.getPatientSessionData.mockResolvedValue([{
            patientId: 'p3',
            name: 'Stuck Patient',
            sessionId: 's3',
            assignedDate: new Date().toISOString(),
            sessionStatus: 'in_progress',
            sessionUpdate: oldUpdate.toISOString(),
            postEval: 0
        }]);

        const result = await service.execute();

        if (Array.isArray(result)) {
            expect(result[0].riskScore).toBe(35);
            expect(result[0].factors).toContain('In-progress antiguo (>24h)');
        } else {
            fail('Result should be an array');
        }
    });

    it('should sort results by risk score in descending order', async () => {
        mockRepository.getPatientSessionData.mockResolvedValue([
            { patientId: 'low', name: 'Low Risk', sessionId: 's1', assignedDate: new Date().toISOString(), sessionStatus: 'completed', postEval: 0 },
            { patientId: 'high', name: 'High Risk', sessionId: 's2', assignedDate: '2000-01-01', sessionStatus: 'assigned', postEval: 0 }
        ]);

        const result = await service.execute();

        if (Array.isArray(result)) {
            expect(result[0].patientId).toBe('high');
            expect(result[1].patientId).toBe('low');
            expect(result[0].riskScore).toBeGreaterThan(result[1].riskScore);
        } else {
            fail('Result should be an array');
        }
    });
});