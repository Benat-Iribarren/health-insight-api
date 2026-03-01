import { Stats } from '../models/Stats';

export const isValidOptionalPatientId = (patientId?: number): boolean =>
    patientId === undefined || (Number.isFinite(patientId) && patientId > 0);

export const buildWeeklyInlineImageCid = (): string => 'stats';

export const deriveWeeklySummary = (
    stats: Stats,
    now: Date = new Date()
): { completed: number; inProgress: number; pending: number; nextWeekSessions: number; name: string } => {
    const norm = (s: string) => String(s ?? '').trim().toLowerCase();

    const isCompleted = (s: string) => {
        const v = norm(s);
        return v === 'completed' || v === 'done' || v === 'finished' || v === 'hecha' || v === 'hechas' || v.includes('complete');
    };

    const isInProgress = (s: string) => {
        const v = norm(s);
        return v === 'in_progress' || v === 'in progress' || v === 'progress' || v === 'en_curso' || v === 'en curso' || v.includes('progress');
    };

    const completed = stats.sessions.filter((x) => isCompleted(x.state)).length;
    const inProgress = stats.sessions.filter((x) => isInProgress(x.state)).length;
    const pending = Math.max(0, stats.sessions.length - completed - inProgress);

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const nextWeekSessions = stats.sessions.filter((x) => {
        const d = new Date(x.assignedDate);
        return Number.isFinite(d.getTime()) && d >= start && d < end;
    }).length;

    return {
        completed,
        inProgress,
        pending,
        nextWeekSessions,
        name: stats.name ?? 'Paciente',
    };
};