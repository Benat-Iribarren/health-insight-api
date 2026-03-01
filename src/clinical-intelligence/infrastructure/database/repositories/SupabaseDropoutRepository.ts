import { SupabaseClient } from '@supabase/supabase-js';
import { DropoutRepository } from '../../../domain/interfaces/DropoutRepository';
import { PatientSessionData } from '../../../domain/models/PatientSessionData';
import { mapPatientSessionData } from '../mappers/mapPatientSessionData';

export class SupabaseDropoutRepository implements DropoutRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getPatientSessionData(patientId?: number): Promise<PatientSessionData[]> {
        let sessionQuery = this.client
            .from('PatientSession')
            .select('patient_id, id, state, assigned_date, created_at, post_evaluation');

        if (patientId !== undefined) sessionQuery = sessionQuery.eq('patient_id', patientId);

        const { data: sessionData, error: sessionError } = await sessionQuery;
        if (sessionError) throw sessionError;
        if (!sessionData || sessionData.length === 0) return [];

        const patientIds = [...new Set(sessionData.map((s: any) => s.patient_id))];

        const { data: patientData, error: patientError } = await this.client
            .from('Patient')
            .select('id, name')
            .in('id', patientIds);

        if (patientError) throw patientError;

        const patientMap = new Map<number, string>();
        (patientData ?? []).forEach((p: any) => patientMap.set(Number(p.id), String(p.name)));

        return sessionData.map((row: any) =>
            mapPatientSessionData(row, patientMap.get(Number(row.patient_id)) ?? 'Desconocido')
        );
    }
}