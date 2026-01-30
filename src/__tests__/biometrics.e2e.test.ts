import { build } from '@common/infrastructure/server/serverBuild';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

describe('E2E | Biometrics', () => {
    let app: any;
    let patientUserId: string;
    let patientSessionId: number;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        const seed = await initBiometricsTestDatabase();
        patientUserId = seed.patientUserId;
        patientSessionId = seed.patientSessionCompletedId!;

        app.addHook('preHandler', async (req: any) => {
            req.user = { id: patientUserId };
        });
    });

    it('biometrics flow', async () => {
        const res = await app.inject({
            method: 'GET',
            url: `/reports/${patientSessionId}`,
        });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toBeDefined();
    });
});