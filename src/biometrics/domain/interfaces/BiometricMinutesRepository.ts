export interface BiometricMinutesRepository {
    upsertBiometricMinutes(rows: Array<Record<string, unknown>>): Promise<void>;
}
