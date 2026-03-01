import { BiometricSample } from '../models/BiometricSample';

export interface BiometricMinutesRepository {
    upsertBiometricMinutes(samples: BiometricSample[]): Promise<void>;
}