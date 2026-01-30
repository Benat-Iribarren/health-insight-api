import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { PatientSessionData } from '../../domain/models/PatientSessionData';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

export const dropoutRepository = (supabase: DBClientService): DropoutRepository => ({
    async getPatientSessionData(patientId?: number): Promise<PatientSessionData[]> {
        const query = supabase.from('PatientSession').select(`
        patientId: patient_id,
        sessionId: id,
        sessionStatus: state,
        assignedDate: assigned_date,
        sessionUpdate: created_at,
        postEval: post_evaluation,
        Patient!inner ( name )
      `);

        if (patientId !== undefined) {
            query.eq('patient_id', patientId);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return (data || []).map((row: any) => ({
            patientId: row.patientId,
            sessionId: row.sessionId,
            sessionStatus: row.sessionStatus,
            assignedDate: row.assignedDate,
            sessionUpdate: row.sessionUpdate,
            postEval: row.postEval,
            name: row.Patient.name,
        }));
    },
});
