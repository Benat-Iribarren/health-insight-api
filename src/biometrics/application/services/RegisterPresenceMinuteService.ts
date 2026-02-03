import { PresenceIntervalRepository } from '../../domain/interfaces/PresenceIntervalRepository';
import { BiometricsError, invalidInputError, unauthorizedError, unknownError } from '../types/BiometricsError';

type Params = {
    patientId: number;
    minuteTsUtc?: string;
    contextType: 'dashboard' | 'session';
    sessionId: number | null;
};

export class RegisterPresenceMinuteService {
    constructor(private readonly repository: PresenceIntervalRepository) {}

    async execute(params: Params): Promise<{ intervalId: number; action: string } | BiometricsError> {
        const minute = params.minuteTsUtc ? new Date(params.minuteTsUtc) : new Date();

        if (Number.isNaN(minute.getTime()) || minute.getUTCSeconds() !== 0 || minute.getUTCMilliseconds() !== 0) {
            return invalidInputError;
        }

        if (!params.patientId) return unauthorizedError;

        try {
            const endMinute = new Date(minute.getTime() + 60000).toISOString();
            const last = await this.repository.findLatestByPatient(params.patientId);

            if (last && last.contextType === params.contextType && last.sessionId === params.sessionId) {
                if (new Date(endMinute) > new Date(last.endMinuteUtc)) {
                    const updated = await this.repository.extendInterval(last.id, endMinute);
                    return { intervalId: updated.id, action: 'extended' };
                }
                return { intervalId: last.id, action: 'idempotent_no_change' };
            }

            const created = await this.repository.createInterval({
                patientId: params.patientId,
                contextType: params.contextType,
                sessionId: params.sessionId,
                startMinuteUtc: minute.toISOString(),
                endMinuteUtc: endMinute,
                attemptNo: params.contextType === 'session' ? 1 : null
            });

            return { intervalId: created.id, action: 'created' };
        } catch {
            return unknownError;
        }
    }
}