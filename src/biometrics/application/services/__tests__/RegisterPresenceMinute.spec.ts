import { RegisterPresenceMinuteService } from '../RegisterPresenceMinuteService';
import { PresenceIntervalRepository } from '../../../domain/interfaces/PresenceIntervalRepository';

describe('Unit | RegisterPresenceMinuteService', () => {
    const contextTypeMock = { dashboard: 'dashboard', session: 'session' } as const;

    it('returns INVALID_INPUT for non-minute timestamp', async () => {
        const repo: PresenceIntervalRepository = {
            findLatestByPatient: async () => null,
            extendInterval: async () => { throw new Error('not used'); },
            createInterval: async () => { throw new Error('not used'); },
        };

        const service = new RegisterPresenceMinuteService(repo);

        const result = await service.execute({
            patientId: 1,
            minuteTsUtc: "2026-01-01T10:00:15Z",
            contextType: 'dashboard',
            sessionId: null,
        });

        expect(result).toBe('INVALID_INPUT');
    });

    it('creates on first minute, extends on next minute, idempotent on repeat', async () => {
        const created = { id: 101, patientId: 1, contextType: 'dashboard' as const, sessionId: null, startMinuteUtc: '', endMinuteUtc: '' };
        let latest: any = null;

        const repo: PresenceIntervalRepository = {
            findLatestByPatient: async () => latest,
            extendInterval: async (id, endMinuteUtc) => {
                latest = { ...latest, id, endMinuteUtc };
                return latest;
            },
            createInterval: async (input) => {
                latest = { ...created, ...input, id: 101 };
                return latest;
            },
        };

        const service = new RegisterPresenceMinuteService(repo);
        const base = new Date("2026-01-01T10:00:00Z");

        const firstCall = await service.execute({
            patientId: 1,
            minuteTsUtc: base.toISOString(),
            contextType: 'dashboard',
            sessionId: null,
        });
        expect((firstCall as any).action).toBe('created');

        const nextMinute = new Date(base.getTime() + 60_000);
        const secondCall = await service.execute({
            patientId: 1,
            minuteTsUtc: nextMinute.toISOString(),
            contextType: 'dashboard',
            sessionId: null,
        });
        expect((secondCall as any).action).toBe('extended');
    });
});