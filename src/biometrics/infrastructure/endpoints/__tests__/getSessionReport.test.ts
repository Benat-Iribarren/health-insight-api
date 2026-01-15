import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

describe('Endpoint: GET /biometrics/session-report/:patientId/:sessionId', () => {
    let app: any;
    let patientId: number;
    let sessionId: string;

    beforeAll(async () => {
        app = build();
        await app.ready();
        const seed = await initTestDatabase();
        patientId = seed.patientId;

        const { supabaseClient } = require('@common/infrastructure/database/supabaseClient');
        const { data } = await supabaseClient
            .from('PatientSession')
            .select('id')
            .eq('patient_id', patientId)
            .limit(1)
            .single();

        sessionId = data.id.toString();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 and the unified report', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/biometrics/session-report/${patientId}/${sessionId}`
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().status).toBe('success');
    });

    it('should return error status for non-existent session', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/biometrics/session-report/${patientId}/999999`
        });

        expect(response.statusCode).toBe(500);
    });
});