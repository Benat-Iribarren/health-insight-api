import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { CLINICAL_RESPONSES } from '../../../domain/ClinicalError';

describe('Endpoint: GET /clinical-intelligence/predict-dropout', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 and the list of patients when no ID is provided', async () => {
        await initTestDatabase();

        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout'
        });

        const successConfig = CLINICAL_RESPONSES.SUCCESS.ANALYSIS_COMPLETED;

        expect(response.statusCode).toBe(successConfig.code);
        expect(response.json()).toEqual(expect.objectContaining({
            status: successConfig.status,
            message: successConfig.message,
            data: expect.any(Array)
        }));
    });

    it('should return 200 and a single object when a valid patientId is provided', async () => {
        const { patientId } = await initTestDatabase();

        const response = await app.inject({
            method: 'GET',
            url: `/clinical-intelligence/predict-dropout/${patientId}`
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data).toHaveProperty('patientId', patientId);
        expect(Array.isArray(response.json().data)).toBe(false);
    });

    it('should return 404 when the patientId does not exist in the system', async () => {
        const errorConfig = CLINICAL_RESPONSES.ERRORS.NO_DATA;

        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/non-existent-id'
        });

        expect(response.statusCode).toBe(errorConfig.status);
        expect(response.json().error).toEqual({
            code: errorConfig.code,
            message: errorConfig.message
        });
    });
});