import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

describe('Endpoint: GET /biometrics/session-report/:patientId/:sessionId', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 and the unified report with 40/60 weighting', async () => {
        const { patientId } = await initTestDatabase();

        const { data: session } = await supabaseClient
            .from('PatientSession')
            .select('id')
            .eq('patient_id', patientId)
            .limit(1)
            .single();

        const sessionId = session?.id;

        const response = await app.inject({
            method: 'GET',
            url: `/biometrics/session-report/${patientId}/${sessionId}`
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();

        expect(body.status).toBe('success');
        expect(body.data).toHaveProperty('final_score_percentage');
        expect(body.data).toHaveProperty('objective_metrics');
        expect(body.data.objective_metrics).toHaveProperty('eda_scl_usiemens');
        expect(body.data.objective_metrics.eda_scl_usiemens).toHaveProperty('pre');
        expect(body.data.objective_metrics.eda_scl_usiemens).toHaveProperty('post');
    });

    it('should return 500 if the session does not exist', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/biometrics/session-report/1/999999'
        });

        expect(response.statusCode).toBe(500);
        expect(response.json().status).toBe('error');
    });
});