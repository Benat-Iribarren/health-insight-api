import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { PatientSessionData } from '../../domain/models/PatientSessionData';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

export const dropoutRepository = (supabase: DBClientService): DropoutRepository => ({
    async getPatientSessionData(patientId?: number): Promise<PatientSessionData[]> {
        let sessionQuery = supabase.from('PatientSession').select(`
            patient_id,
            id,
            state,
            assigned_date,
            created_at,
            post_evaluation
        `);

        if (patientId !== undefined) {
            sessionQuery = sessionQuery.eq('patient_id', patientId);
        }

        const { data: sessionData, error: sessionError } = await sessionQuery;

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionData || sessionData.length === 0) {
            return [];
        }

        const patientIds = [...new Set(sessionData.map((s) => s.patient_id))];

        const { data: patientData, error: patientError } = await supabase
            .from('Patient')
            .select('id, name')
            .in('id', patientIds);

        if (patientError) {
            throw patientError;
        }

        const patientMap = new Map<number, string>();
        patientData?.forEach((p) => {
            patientMap.set(p.id, p.name);
        });

        return sessionData.map((row) => ({
            patientId: row.patient_id,
            sessionId: row.id,
            sessionStatus: row.state,
            assignedDate: row.assigned_date,
            sessionUpdate: row.created_at,
            postEval: row.post_evaluation ?? 0,
            name: patientMap.get(row.patient_id) ?? 'Desconocido',
        }));
    },
});