import { Stats } from '../../../domain/models/Stats';

export type StatsRow = {
    id: number;
    email: string | null;
    name: string | null;
    PatientSession: Array<{ state: string; assigned_date: string }>;
};

export function mapStatsRow(r: StatsRow): Stats {
    return {
        patientId: Number(r.id),
        email: r.email ?? null,
        name: r.name ?? null,
        sessions: (r.PatientSession ?? []).map((s) => ({
            state: String(s.state),
            assignedDate: String(s.assigned_date),
        })),
    };
}