import { build } from '@common/infrastructure/server/serverBuild';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async (request: any) => { request.auth = { userId: 'pro-user' }; },
    verifyPatient: () => async () => {},
}));

jest.mock('@src/biometrics/infrastructure/database/SupabaseSessionMetricsRepository', () => {
    return {
        SupabaseSessionMetricsRepository: jest.fn().mockImplementation(() => ({
            getFullSessionContext: jest.fn().mockImplementation((pId, sId) => {
                if (pId === 999999) return Promise.resolve({ sessions: [], intervals: [], total: 0 });
                return Promise.resolve({
                    sessions: [{ session_id: sId || 2210, state: 'completed', pre_evaluation: 3, post_evaluation: 7 }],
                    intervals: [{ session_id: sId || 2210, context_type: 'session', start_minute_utc: '2026-01-01T10:00:00Z', end_minute_utc: '2026-01-01T10:10:00Z' }],
                    total: 1
                });
            }),
            getBiometricData: jest.fn().mockResolvedValue([
                { timestamp_iso: '2026-01-01T10:05:00Z', pulse_rate_bpm: 80, eda_scl_usiemens: 1.5, temperature_celsius: 36.5 }
            ])
        }))
    };
});

describe('Integration | GET /reports/:patientId/:sessionId?', () => {
    let app: any;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('returns 200 with paginated data for patientId', async () => {
        const res = await app.inject({ method: 'GET', url: `/reports/1` });
        const body = res.json();
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta).toBeDefined();
        expect(body.meta.page).toBe(1);
    });

    it('returns 200 with object inside data for patientId + sessionId', async () => {
        const res = await app.inject({ method: 'GET', url: `/reports/1/2210` });
        const body = res.json();
        expect(res.statusCode).toBe(200);
        expect(body.data.session_id).toBe('2210');
    });

    it('returns 400 for invalid patientId', async () => {
        const res = await app.inject({ method: 'GET', url: '/reports/invalid' });
        expect(res.statusCode).toBe(400);
    });

    it('returns 404 when no data found', async () => {
        const res = await app.inject({ method: 'GET', url: '/reports/999999' });
        expect(res.statusCode).toBe(404);
    });
});