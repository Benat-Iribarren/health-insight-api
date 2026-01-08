import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { CLINICAL_RESPONSES } from '../../domain/ClinicalError';

describe('E2E: Predict Dropout Flow', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return a full list of dropout risks for all patients', async () => {
        await initTestDatabase();

        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout'
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return 404 if the patient does not exist or has no data', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/999999'
        });

        expect(response.statusCode).toBe(CLINICAL_RESPONSES.ERRORS.NO_DATA.status);
        expect(response.json().error.code).toBe(CLINICAL_RESPONSES.ERRORS.NO_DATA.code);
    });
});