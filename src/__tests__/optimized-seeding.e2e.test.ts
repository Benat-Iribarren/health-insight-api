import { FastifyInstance } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';
import {
  seedMessagingContext,
  seedBiometricsContext,
  teardownMessagingContext,
  teardownBiometricsContext,
  type MessagingContext,
  type BiometricsContext,
} from '@src/common/infrastructure/database/test-seeds';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
  verifyHybridAccess: jest.fn(() => (_req: any, _res: any, done: any) => done()),
  verifyProfessional: jest.fn(() => (_req: any, _res: any, done: any) => done()),
  verifyPatient: jest.fn(() => (request: any, _reply: any, done: any) => {
    const patientId = request.headers['x-test-patient-id'];
    const userId = request.headers['x-test-user-id'];
    request.auth = {
      userId: userId || 'test-user-uuid',
      patientId: patientId ? Number(patientId) : undefined,
    };
    done();
  }),
}));

describe('E2E | Optimized Seeding Strategy', () => {
  let app: FastifyInstance;
  let messagingContext: MessagingContext;
  let biometricsContext: BiometricsContext;

  beforeAll(async () => {
    app = build();
    await app.ready();

    [messagingContext, biometricsContext] = await Promise.all([
      seedMessagingContext(),
      seedBiometricsContext(),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      messagingContext && teardownMessagingContext(messagingContext),
      biometricsContext && teardownBiometricsContext(biometricsContext),
    ]);
    if (app) {
      await app.close();
    }
  });

  it('should demonstrate isolated messaging context with dynamic data', async () => {
    expect(messagingContext.patientId).toBeDefined();
    expect(messagingContext.email).toContain('@competition.com');
    expect(messagingContext.patientUserId).toBeDefined();
    expect(messagingContext.notificationId).toBeDefined();
  });

  it('should demonstrate isolated biometrics context', async () => {
    const presenceTime = new Date();
    presenceTime.setUTCSeconds(0, 0);
    presenceTime.setUTCMilliseconds(0);

    const res = await app.inject({
      method: 'POST',
      url: '/presence/minute',
      headers: {
        'x-test-patient-id': String(biometricsContext.patientId),
        'x-test-user-id': biometricsContext.patientUserId,
      },
      payload: {
        minuteTsUtc: presenceTime.toISOString(),
        contextType: 'dashboard',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(biometricsContext.patientId).not.toBe(messagingContext.patientId);
    expect(biometricsContext.email).not.toBe(messagingContext.email);
  });
});
