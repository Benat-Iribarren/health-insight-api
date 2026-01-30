jest.mock('@src/identity/infrastructure/http/verifyUser', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {},
}));

import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';
import { PRESENCE_MINUTE_ENDPOINT } from '../presenceMinute/presenceMinute';

describe('Integration | POST /presence/minute', () => {
    let app: any;
    let userId: string;

    beforeAll(async () => {
        const { build } = require('@common/infrastructure/server/serverBuild');
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        const seed = await initBiometricsTestDatabase();
        userId = seed.patientUserId;

        app.addHook('preHandler', async (req: any) => {
            req.user = { id: userId };
        });
    });

    it('returns 200 and creates interval', async () => {
        const base = new Date();
        base.setUTCSeconds(0, 0);

        const res = await app.inject({
            method: 'POST',
            url: PRESENCE_MINUTE_ENDPOINT,
            payload: { contextType: 'dashboard', minuteTsUtc: base.toISOString(), sessionId: null },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.status).toBe('ok');
        expect(body.action).toBe('created');
        expect(typeof body.intervalId).toBe('string');
    });

    it('returns 200 and extends on next minute', async () => {
        const base = new Date();
        base.setUTCSeconds(0, 0);

        const r1 = await app.inject({
            method: 'POST',
            url: PRESENCE_MINUTE_ENDPOINT,
            payload: { contextType: 'dashboard', minuteTsUtc: base.toISOString(), sessionId: null },
        });

        expect(r1.statusCode).toBe(200);

        const next = new Date(base.getTime() + 60_000);

        const r2 = await app.inject({
            method: 'POST',
            url: PRESENCE_MINUTE_ENDPOINT,
            payload: { contextType: 'dashboard', minuteTsUtc: next.toISOString(), sessionId: null },
        });

        expect(r2.statusCode).toBe(200);
        const body = r2.json();
        expect(['extended', 'idempotent_no_change']).toContain(body.action);
    });
});
