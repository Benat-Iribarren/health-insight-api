import { supabaseClient } from './supabaseClient';
import { randomUUID } from 'node:crypto';

export async function initTestDatabase() {
    await supabaseClient.from('Survey').delete().neq('id', 0);
    await supabaseClient.from('PatientSession').delete().neq('id', 0);
    await supabaseClient.from('Session').delete().neq('id', 0);
    await supabaseClient.from('Patient').delete().neq('id', 0);
    await supabaseClient.from('Question').delete().neq('id', 0);
    await supabaseClient.from('ContextIntervals').delete().neq('id', 0);
    await supabaseClient.from('BiometricMinutes').delete().neq('id', 0);

    const uniqueUserId = randomUUID();

    const { data: patientData, error: pError } = await supabaseClient
        .from('Patient')
        .upsert({
            user_id: uniqueUserId,
            name: 'Beñat',
            surname: 'Test',
            email: 'benat@test.com',
            phone: '600000000',
            birth_date: '1990-01-01',
            gender: 'M',
            username: `user_${uniqueUserId.split('-')[0]}`
        }, { onConflict: 'user_id' })
        .select();

    if (pError || !patientData || patientData.length === 0) {
        throw new Error(`Error seeding Patient: ${pError?.message}`);
    }

    const { data: sessionData, error: sError } = await supabaseClient
        .from('Session')
        .upsert({
            number: 1,
            day_offset: 1
        })
        .select();

    if (sError || !sessionData || sessionData.length === 0) {
        throw new Error(`Error seeding Session: ${sError?.message}`);
    }

    await supabaseClient.from('Question').upsert({ id: 1 }, { onConflict: 'id' });

    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 3);

    const { data: psData, error: psError } = await supabaseClient
        .from('PatientSession')
        .insert({
            session_id: sessionData[0].id,
            patient_id: patientData[0].id,
            state: 'completed',
            assigned_date: lastWeekDate.toISOString().split('T')[0],
            pre_evaluation: 2,
            post_evaluation: 5
        })
        .select('id')
        .single();

    if (psError || !psData) {
        throw new Error(`Error seeding PatientSession: ${psError?.message}`);
    }

    const now = new Date();
    now.setUTCSeconds(0, 0);

    const preStart = new Date(now.getTime() - 30 * 60_000);
    const preEnd = new Date(now.getTime() - 20 * 60_000);
    const sesStart = new Date(now.getTime() - 20 * 60_000);
    const sesEnd = new Date(now.getTime() - 10 * 60_000);
    const postStart = new Date(now.getTime() - 10 * 60_000);
    const postEnd = new Date(now.getTime());

    await supabaseClient.from('ContextIntervals').insert([
        {
            patient_id: patientData[0].id,
            context_type: 'dashboard',
            session_id: null,
            start_minute_utc: preStart.toISOString(),
            end_minute_utc: preEnd.toISOString(),
            attempt_no: null
        },
        {
            patient_id: patientData[0].id,
            context_type: 'session',
            session_id: psData.id,
            start_minute_utc: sesStart.toISOString(),
            end_minute_utc: sesEnd.toISOString(),
            attempt_no: 1
        },
        {
            patient_id: patientData[0].id,
            context_type: 'dashboard',
            session_id: null,
            start_minute_utc: postStart.toISOString(),
            end_minute_utc: postEnd.toISOString(),
            attempt_no: null
        }
    ]);

    await supabaseClient.from('BiometricMinutes').insert([
        {
            timestamp_iso: preStart.toISOString(),
            timestamp_unix_ms: preStart.getTime(),
            eda_scl_usiemens: 1.2,
            pulse_rate_bpm: 70,
            temperature_celsius: 36.5,
            accel_std_g: 0.01,
            respiratory_rate_brpm: 14
        },
        {
            timestamp_iso: sesStart.toISOString(),
            timestamp_unix_ms: sesStart.getTime(),
            eda_scl_usiemens: 1.6,
            pulse_rate_bpm: 80,
            temperature_celsius: 36.7,
            accel_std_g: 0.05,
            respiratory_rate_brpm: 18
        },
        {
            timestamp_iso: postStart.toISOString(),
            timestamp_unix_ms: postStart.getTime(),
            eda_scl_usiemens: 1.1,
            pulse_rate_bpm: 68,
            temperature_celsius: 36.4,
            accel_std_g: 0.01,
            respiratory_rate_brpm: 12
        }
    ]);

    return { patientId: patientData[0].id, userId: uniqueUserId };
}