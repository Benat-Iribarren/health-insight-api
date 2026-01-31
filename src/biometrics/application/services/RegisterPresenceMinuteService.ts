import { PresenceIntervalRepository } from '../../domain/interfaces/PresenceIntervalRepository';
import { ContextType } from '../../domain/models/PresenceInterval';
import { BiometricsError, invalidInputError, unauthorizedError, unknownError } from '../types/BiometricsError';

type Params = {
    patientId: string;
    minuteTsUtc?: string;
    contextType: ContextType;
    sessionId: string | null;
};

export type PresenceResult = {
    intervalId: string;
    action: 'created' | 'extended' | 'idempotent_no_change';
};

export class RegisterPresenceMinuteService {
    constructor(private readonly repository: PresenceIntervalRepository) {}

    async execute(params: Params): Promise<PresenceResult | BiometricsError> {
        try {
            const now = new Date();
            now.setUTCSeconds(0, 0);

            const minute = params.minuteTsUtc ? new Date(params.minuteTsUtc) : now;

            const validationError = this.validate(params, minute);
            if (validationError) return validationError;

            const endMinute = new Date(minute.getTime() + 60_000).toISOString();

            const last = await this.repository.findLatestByPatient(params.patientId);

            const sameContext =
                !!last &&
                last.contextType === params.contextType &&
                (last.sessionId ?? null) === params.sessionId;

            if (sameContext && last?.id) {
                const lastEnd = new Date(last.endMinuteUtc);
                if (new Date(endMinute) > lastEnd) {
                    const updated = await this.repository.extendInterval(last.id, endMinute);
                    return { intervalId: updated.id as string, action: 'extended' };
                }
                return { intervalId: last.id, action: 'idempotent_no_change' };
            }

            const created = await this.repository.createInterval({
                patientId: params.patientId,
                contextType: params.contextType,
                sessionId: params.sessionId,
                startMinuteUtc: minute.toISOString(),
                endMinuteUtc: endMinute,
                attemptNo: params.contextType === 'session' ? 1 : null,
            });

            return { intervalId: created.id as string, action: 'created' };
        } catch {
            return unknownError;
        }
    }

    private validate(params: Params, date: Date): BiometricsError | null {
        if (!params.patientId) return unauthorizedError;
        if (Number.isNaN(date.getTime())) return invalidInputError;
        if (date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) return invalidInputError;
        if (params.contextType !== 'dashboard' && params.contextType !== 'session') return invalidInputError;
        if (params.contextType === 'session' && (!params.sessionId || !this.isUuid(params.sessionId))) return invalidInputError;
        if (params.contextType === 'dashboard' && params.sessionId !== null) return invalidInputError;
        return null;
    }

    private isUuid(value: string) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }
}
