import { RegisterPresenceMinuteService } from '../RegisterPresenceMinuteService';
import { PresenceIntervalRepository } from '../../../domain/interfaces/PresenceIntervalRepository';

describe('Unit | RegisterPresenceMinuteService', () => {
    const contextTypeMock = { dashboard: 'dashboard', session: 'session' } as const;

    it('returns INVALID_INPUT for non-minute timestamp', async () => {
        const repo: PresenceIntervalRepository = {
            findLatestByPatient: async () => null,
            extendInterval: async () => { throw new Error('not used'); },
            createInterval: async () => { throw new Error('not used'); },
            ContextType: contextTypeMock as any
        };

        const uc = new RegisterPresenceMinuteService(repo);

        const result = await uc.execute({
            patientId: 'p1',
            minuteTsUtc: new Date().toISOString(),
            contextType: 'dashboard',
            sessionId: null,
        });

        expect(result).toBe('INVALID_INPUT');
    });

    it('creates on first minute, extends on next minute, idempotent on repeat', async () => {
        const created = { id: 'i1', patientId: 'p1', contextType: 'dashboard', sessionId: null, startMinuteUtc: '', endMinuteUtc: '' };
        let latest: any = null;

        const repo: PresenceIntervalRepository = {
            findLatestByPatient: async () => latest,
            extendInterval: async (id, endMinuteUtc) => {
                latest = { ...latest, id, endMinuteUtc };
                return latest;
            },
            createInterval: async (input) => {
                latest = { ...created, ...input, id: 'i1' };
                return latest;
            },
            ContextType: contextTypeMock as any
        };

        const uc = new RegisterPresenceMinuteService(repo);
        const base = new Date();
        base.setUTCSeconds(0, 0);

        const r1 = await uc.execute({
            patientId: 'p1',
            minuteTsUtc: base.toISOString(),
            contextType: 'dashboard',
            sessionId: null,
        });
        expect((r1 as any).action).toBe('created');

        const r2 = await uc.execute({
            patientId: 'p1',
            minuteTsUtc: base.toISOString(),
            contextType: 'dashboard',
            sessionId: null,
        });
        expect((r2 as any).action).toBe('idempotent_no_change');

        const next = new Date(base.getTime() + 60_000);
        const r3 = await uc.execute({
            patientId: 'p1',
            minuteTsUtc: next.toISOString(),
            contextType: 'dashboard',
            sessionId: null,
        });
        expect((r3 as any).action).toBe('extended');
    });
});