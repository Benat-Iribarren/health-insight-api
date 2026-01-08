import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

export class SupabaseDropoutRepository implements DropoutRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getPatientSessionData(patientId?: string): Promise<any[]> {
        let query = this.supabase
            .from('Patient')
            .select(`
                patientId: id,
                name,
                PatientSession (
                    sessionId: id,
                    sessionStatus: state,
                    assignedDate: assigned_date,
                    sessionUpdate: created_at,
                    postEval: post_evaluation
                )
            `);

        if (patientId) {
            query = query.eq('id', parseInt(patientId));
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data as any[]).flatMap(patient =>
            patient.PatientSession.map((session: any) => ({
                patientId: patient.patientId,
                name: patient.name,
                ...session
            }))
        );
    }
}