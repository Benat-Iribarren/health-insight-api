import { supabaseClient } from '../supabaseClient';

export async function initClinicalIntelligenceTestDatabase() {
    await supabaseClient.from('PatientSession').delete().neq('id', 0);
    await supabaseClient.from('Session').delete().neq('id', 0);
    await supabaseClient.from('Patient').delete().neq('id', 0);

    const { data: pData } = await supabaseClient
        .from('Patient')
        .insert([
            { name: 'Overdue', surname: 'Patient', email: 'overdue@test.com', phone: '1', birth_date: '1990-01-01', gender: 'M', username: 'overdue', user_id: 'u1' },
            { name: 'Healthy', surname: 'Patient', email: 'healthy@test.com', phone: '2', birth_date: '1990-01-01', gender: 'F', username: 'healthy', user_id: 'u2' }
        ])
        .select();

    const { data: sData } = await supabaseClient
        .from('Session')
        .insert([{ number: 1, day_offset: 1 }])
        .select();

    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 15);

    await supabaseClient.from('PatientSession').insert([
        {
            session_id: sData![0].id,
            patient_id: pData![0].id,
            state: 'assigned',
            assigned_date: overdueDate.toISOString(),
            pre_evaluation: 0,
            post_evaluation: 0
        },
        {
            session_id: sData![0].id,
            patient_id: pData![1].id,
            state: 'completed',
            assigned_date: new Date().toISOString(),
            pre_evaluation: 5,
            post_evaluation: 8
        }
    ]);

    return {
        patientIdOverdue: pData![0].id,
        patientIdHealthy: pData![1].id
    };
}