import { build } from '@common/infrastructure/server/serverBuild';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async (request: any) => { request.auth = { userId: 'pro-user' }; },
    verifyPatient: () => async () => {},
}));

jest.mock('@src/biometrics/infrastructure/database/repositories/SupabaseSessionMetricsRepository', () => {
    return {
        SupabaseSessionMetricsRepository: jest.fn().mockImplementation(() => ({
            getFullSessionContext: jest.fn().mockImplementation((pId, sId) => {
                if (pId === 999999) return Promise.resolve({ sessions: [], intervals: [], total: 0 });
                const sessionId = Number(sId || 2210);
                return Promise.resolve({
                    sessions: [{ sessionId, state: 'completed', preEvaluation: 3, postEvaluation: 7, assignedDate: null }],
                    intervals: [{ sessionId, contextType: 'session', startMinuteUtc: new Date('2026-01-01T10:00:00Z'), endMinuteUtc: new Date('2026-01-01T10:10:00Z') }],
                    total: 1
                });
            }),
            getBiometricData: jest.fn().mockResolvedValue([
                {
                    timestamp: new Date('2026-01-01T10:05:00Z'),
                    pulseRateBpm: 80,
                    edaSclUsiemens: 1.5,
                    temperatureCelsius: 36.5,
                    accelStdG: null,
                    respiratoryRateBrpm: null,
                    bodyPositionType: null,
                },
            ])
        }))
    };
});

describe('Integration | GET /reports/:patientId/:sessionId?', () => {
    let app: any;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('returns 200 with paginated data for patientId', async () => {
        const res = await app.inject({ method: 'GET', url: `/biometrics/session-report/1` });
        const body = res.json();
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta).toBeDefined();
        expect(body.meta.page).toBe(1);
    });

    it('returns 200 with object inside data for patientId + sessionId', async () => {
        const res = await app.inject({ method: 'GET', url: `/biometrics/session-report/1/2210` });
        const body = res.json();
        expect(res.statusCode).toBe(200);
        expect(body.data.sessionId).toBe('2210');
    });

    it('returns 400 for invalid patientId', async () => {
        const res = await app.inject({ method: 'GET', url: '/biometrics/session-report/invalid' });
        expect(res.statusCode).toBe(400);
    });

    it('returns 404 when no data found', async () => {
        const res = await app.inject({ method: 'GET', url: '/biometrics/session-report/999999' });
        expect(res.statusCode).toBe(404);
    });
});