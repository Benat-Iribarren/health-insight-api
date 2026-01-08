import { supabaseClient } from './supabaseClient';
import { randomUUID } from 'node:crypto';

export async function initTestDatabase() {
    await supabaseClient.from('Survey').delete().neq('id', 0);
    await supabaseClient.from('PatientSession').delete().neq('id', 0);
    await supabaseClient.from('Session').delete().neq('id', 0);
    await supabaseClient.from('Patient').delete().neq('id', 0);
    await supabaseClient.from('Question').delete().neq('id', 0);

    const uniqueUserId = randomUUID();

    const { data: patientData, error: pError } = await supabaseClient.from('Patient').upsert({
        user_id: uniqueUserId,
        name: 'Beñat',
        surname: 'Test',
        email: 'benat@test.com',
        phone: '600000000',
        birth_date: '1990-01-01',
        gender: 'M',
        username: `user_${uniqueUserId.split('-')[0]}`
    }, { onConflict: 'user_id' }).select();

    if (pError || !patientData || patientData.length === 0) {
        throw new Error(`Error seeding Patient: ${pError?.message}`);
    }

    const { data: sessionData, error: sError } = await supabaseClient.from('Session').upsert({
        number: 1,
        day_offset: 1
    }).select();

    if (sError || !sessionData || sessionData.length === 0) {
        throw new Error(`Error seeding Session: ${sError?.message}`);
    }

    await supabaseClient.from('Question').upsert({ id: 1 }, { onConflict: 'id' });

    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 3);

    const { error: psError } = await supabaseClient.from('PatientSession').insert({
        session_id: sessionData[0].id,
        patient_id: patientData[0].id,
        state: 'completed',
        assigned_date: lastWeekDate.toISOString().split('T')[0]
    });

    if (psError) {
        throw new Error(`Error seeding PatientSession: ${psError.message}`);
    }

    return { patientId: patientData[0].id };
}