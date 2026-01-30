import { supabaseClient } from '../supabaseClient';
import { randomUUID } from 'node:crypto';

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;
const PRE_WINDOW_MIN = 10;
const SESSION_WINDOW_MIN = 10;
const POST_WINDOW_MIN = 10;
const OFFSET_FROM_NOW_MIN = 30;
const ASSIGNED_COMPLETED_DAYS_AGO = 3;
const ASSIGNED_ASSIGNED_DAYS_AGO = 10;

const toMinuteUtc = (d: Date) => {
    const x = new Date(d);
    x.setUTCSeconds(0, 0);
    return x;
};

const addMin = (d: Date, minutes: number) => new Date(d.getTime() + minutes * MS_PER_MIN);
const subMin = (d: Date, minutes: number) => new Date(d.getTime() - minutes * MS_PER_MIN);
const subDays = (d: Date, days: number) => new Date(d.getTime() - days * MS_PER_DAY);

const BIOMETRICS = {
    pre: { pulse_rate_bpm: 60, eda_scl_usiemens: 1.0, temperature_celsius: 36.8, accel_std_g: 0.01, respiratory_rate_brpm: 14, body_position_type: 'left' },
    session: { pulse_rate_bpm: 90, eda_scl_usiemens: 2.0, temperature_celsius: 36.4, accel_std_g: 0.05, respiratory_rate_brpm: 18, body_position_type: 'left' },
    post: { pulse_rate_bpm: 65, eda_scl_usiemens: 1.1, temperature_celsius: 36.7, accel_std_g: 0.01, respiratory_rate_brpm: 12, body_position_type: 'right' },
} as const;

export async function initBiometricsTestDatabase() {
    await supabaseClient.from('BiometricMinutes').delete().neq('timestamp_iso', '');
    await supabaseClient.from('ContextIntervals').delete().neq('id', 0);
    await supabaseClient.from('PatientSession').delete().neq('id', 0);
    await supabaseClient.from('Session').delete().neq('id', 0);
    await supabaseClient.from('Patient').delete().neq('id', 0);

    const userId = randomUUID();

    const { data: patients, error: pErr } = await supabaseClient
        .from('Patient')
        .insert([{
            user_id: userId,
            name: 'Biometrics',
            surname: 'Test',
            email: `biometrics_${userId}@test.com`,
            phone: '600000000',
            birth_date: '1990-01-01',
            gender: 'M',
            username: `user_${userId.slice(0, 8)}`,
        }])
        .select();

    if (pErr || !patients?.[0]) throw new Error(pErr?.message ?? 'Seed Patient failed');

    const { data: sessions, error: sErr } = await supabaseClient
        .from('Session')
        .insert([{ number: 1, day_offset: 1 }, { number: 2, day_offset: 2 }])
        .select();

    if (sErr || !sessions?.length) throw new Error(sErr?.message ?? 'Seed Session failed');

    const now = toMinuteUtc(new Date());
    const assignedCompleted = subDays(now, ASSIGNED_COMPLETED_DAYS_AGO).toISOString();
    const assignedAssigned = subDays(now, ASSIGNED_ASSIGNED_DAYS_AGO).toISOString();

    const { data: ps, error: psErr } = await supabaseClient
        .from('PatientSession')
        .insert([
            { session_id: sessions[0].id, patient_id: patients[0].id, state: 'completed', assigned_date: assignedCompleted, pre_evaluation: 2, post_evaluation: 5 },
            { session_id: sessions[1].id, patient_id: patients[0].id, state: 'assigned', assigned_date: assignedAssigned, pre_evaluation: 0, post_evaluation: 0 },
        ])
        .select();

    if (psErr || !ps?.length) throw new Error(psErr?.message ?? 'Seed PatientSession failed');

    const patientDbId = patients[0].id;
    const patientUserId = patients[0].user_id;
    const patientSessionCompletedId = ps.find((x) => x.session_id === sessions[0].id)?.id;

    const t0 = subMin(now, OFFSET_FROM_NOW_MIN);
    const preStart = t0;
    const preEnd = addMin(preStart, PRE_WINDOW_MIN);
    const sesStart = preEnd;
    const sesEnd = addMin(sesStart, SESSION_WINDOW_MIN);
    const postStart = sesEnd;
    const postEnd = addMin(postStart, POST_WINDOW_MIN);

    const intervals = [
        { patient_id: patientDbId, context_type: 'dashboard', session_id: null, start_minute_utc: preStart.toISOString(), end_minute_utc: preEnd.toISOString() },
        { patient_id: patientDbId, context_type: 'session', session_id: patientSessionCompletedId, start_minute_utc: sesStart.toISOString(), end_minute_utc: sesEnd.toISOString(), attempt_no: 1 },
        { patient_id: patientDbId, context_type: 'dashboard', session_id: null, start_minute_utc: postStart.toISOString(), end_minute_utc: postEnd.toISOString() },
    ];

    const { error: iErr } = await supabaseClient.from('ContextIntervals').insert(intervals as any);
    if (iErr) throw new Error(iErr.message);

    const mkBm = (base: Date, metric: any) => ({
        timestamp_iso: addMin(base, 1).toISOString(),
        timestamp_unix_ms: addMin(base, 1).getTime(),
        ...metric,
    });

    const bmRows = [mkBm(preStart, BIOMETRICS.pre), mkBm(sesStart, BIOMETRICS.session), mkBm(postStart, BIOMETRICS.post)];
    const { error: bErr } = await supabaseClient.from('BiometricMinutes').insert(bmRows as any);
    if (bErr) throw new Error(bErr.message);

    return { patientDbId, patientUserId, patientSessionCompletedId, windows: { pre: { start: preStart.toISOString(), end: preEnd.toISOString() }, session: { start: sesStart.toISOString(), end: sesEnd.toISOString() }, post: { start: postStart.toISOString(), end: postEnd.toISOString() } } };
}