import { Session } from '../models/Session';
import { ContextInterval } from '../models/ContextInterval';
import { BiometricSample } from '../models/BiometricSample';

export interface SessionMetricsRepository {
    getFullSessionContext(
        patientId: number,
        sessionId?: number,
        limit?: number,
        offset?: number
    ): Promise<{ sessions: Session[]; intervals: ContextInterval[]; total: number }>;

    getBiometricData(startIso: string, endIso: string): Promise<BiometricSample[]>;
}