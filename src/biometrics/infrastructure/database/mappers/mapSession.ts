import { Session } from '../../../domain/models/Session';

export function mapSession(r: any): Session {
    return {
        sessionId: Number(r.session_id),
        state: String(r.state),
        preEvaluation: r.pre_evaluation ?? null,
        postEvaluation: r.post_evaluation ?? null,
        assignedDate: r.assigned_date ?? null,
    };
}