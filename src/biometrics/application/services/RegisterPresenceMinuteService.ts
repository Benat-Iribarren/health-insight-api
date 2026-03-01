import { PresenceIntervalRepository } from '../../domain/interfaces/PresenceIntervalRepository';
import { BiometricsError, invalidInputError, unknownError } from '../types/BiometricsError';
import { decidePresenceMinute, isValidUtcMinute } from '../../domain/logic/presenceMinutePolicy';

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

        if (!isValidUtcMinute(minute)) return invalidInputError;

        try {
            const last = await this.repository.findLatestByPatient(params.patientId);

            const decision = decidePresenceMinute(last ?? null, {
                patientId: params.patientId,
                minute,
                contextType: params.contextType,
                sessionId: params.sessionId,
            });

            if (decision.kind === 'extend') {
                const updated = await this.repository.extendInterval(
                    decision.intervalId,
                    decision.newEndIso
                );
                return { intervalId: updated.id, action: 'extended' };
            }

            if (decision.kind === 'idempotent') {
                return { intervalId: decision.intervalId, action: 'idempotentNoChange' };
            }

            const created = await this.repository.createInterval({
                patientId: params.patientId,
                contextType: params.contextType,
                sessionId: params.sessionId,
                startMinuteUtc: decision.startIso,
                endMinuteUtc: decision.endIso,
                attemptNo: decision.attemptNo,
            });

            return { intervalId: created.id, action: 'created' };
        } catch {
            return unknownError;
        }
    }
}