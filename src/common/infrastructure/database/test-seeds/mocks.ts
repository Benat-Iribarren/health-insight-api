import { FastifyRequest, FastifyReply } from 'fastify';

export interface MockAuthContext {
  userId: string;
  patientId?: number;
  role?: 'patient' | 'professional' | 'hybrid';
}

interface AuthenticatedRequest extends FastifyRequest {
  auth: MockAuthContext;
}

export const createMockVerifyPatient = () => {
  return jest.fn(() => (req: FastifyRequest, _res: FastifyReply, done: (err?: Error) => void) => {
    const testPatientId = req.headers['x-test-patient-id'] as string;
    const testUserId = req.headers['x-test-user-id'] as string;

    if (!testPatientId) {
      return done(new Error('x-test-patient-id header required for mocked patient verification'));
    }

    (req as unknown as AuthenticatedRequest).auth = {
      userId: testUserId || 'test-patient-user',
      patientId: parseInt(testPatientId, 10),
      role: 'patient',
    };

    done();
  });
};

export const createMockVerifyProfessional = () => {
  return jest.fn(() => (req: FastifyRequest, _res: FastifyReply, done: (err?: Error) => void) => {
    const testUserId = req.headers['x-test-user-id'] as string;

    (req as unknown as AuthenticatedRequest).auth = {
      userId: testUserId || 'test-professional-user',
      role: 'professional',
    };

    done();
  });
};

export const createMockVerifyHybridAccess = () => {
  return jest.fn(() => (req: FastifyRequest, _res: FastifyReply, done: (err?: Error) => void) => {
    const testPatientId = req.headers['x-test-patient-id'] as string;
    const testUserId = req.headers['x-test-user-id'] as string;

    (req as unknown as AuthenticatedRequest).auth = {
      userId: testUserId || 'test-hybrid-user',
      patientId: testPatientId ? parseInt(testPatientId, 10) : undefined,
      role: 'hybrid',
    };

    done();
  });
};

export const mockIdentityMiddlewares = {
  verifyPatient: createMockVerifyPatient(),
  verifyProfessional: createMockVerifyProfessional(),
  verifyHybridAccess: createMockVerifyHybridAccess(),
};
