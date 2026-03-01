import { PatientSessionData } from '../../../domain/models/PatientSessionData';

export function mapPatientSessionData(row: unknown, patientName: string): PatientSessionData {
    const r = row as Record<string, unknown>;

    return {
        patientId: Number(r.patient_id),
        name: patientName,
        sessionId: Number(r.id),
        sessionStatus: String(r.state),
        assignedDate: String(r.assigned_date),
        sessionUpdate: r.created_at == null ? null : String(r.created_at),
        postEval: typeof r.post_evaluation === 'number' ? r.post_evaluation : Number(r.post_evaluation) || 0,
    };
}