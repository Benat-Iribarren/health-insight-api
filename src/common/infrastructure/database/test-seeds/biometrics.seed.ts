import { supabaseClient } from '../supabaseClient';
import { randomUUID } from 'node:crypto';

export async function initBiometricsTestDatabase() {
    await supabaseClient.from('BiometricMinutes').delete().neq('id', 0);
    await supabaseClient.from('ContextIntervals').delete().neq('id', 0);
    await supabaseClient.from('PatientSession').delete().neq('id', 0);
    await supabaseClient.from('Session').delete().neq('id', 0);
    await supabaseClient.from('Patient').delete().neq('id', 0);

    const userId = randomUUID();
    const { data: patient } = await supabaseClient.from('Patient').insert([{
        user_id: userId,
        name: 'Biometrics',
        surname: 'Test',
        email: `test_${userId.slice(0, 5)}@example.com`,
        phone: '123456789',
        birth_date: '1990-01-01',
        gender: 'M',
        username: `user_${userId.slice(0, 8)}`,
    }]).select().single();

    const { data: session } = await supabaseClient.from('Session').insert([{
        number: 1,
        day_offset: 0
    }]).select().single();

    const now = new Date();
    now.setUTCSeconds(0, 0);
    const startIso = new Date(now.getTime() - 600000).toISOString();
    const endIso = now.toISOString();

    const { data: ps } = await supabaseClient.from('PatientSession').insert([{
        session_id: session!.id,
        patient_id: patient!.id,
        state: 'completed',
        assigned_date: startIso,
        pre_evaluation: 2,
        post_evaluation: 6
    }]).select().single();

    await supabaseClient.from('ContextIntervals').insert([{
        patient_id: patient!.id,
        session_id: ps!.id,
        context_type: 'session',
        start_minute_utc: startIso,
        end_minute_utc: endIso
    }]);

    return {
        patientId: patient!.id,
        patientUserId: userId,
        patientSessionId: ps!.id,
        startTime: startIso,
        endTime: endIso
    };
}