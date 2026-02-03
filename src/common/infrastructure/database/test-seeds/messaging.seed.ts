import { supabaseClient } from '../supabaseClient';
import { randomUUID } from 'node:crypto';

export async function initMessagingTestDatabase() {
    await supabaseClient.from('PatientNotifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('Patient').delete().neq('id', 0);

    const userId = randomUUID();
    const { data: patient } = await supabaseClient.from('Patient').insert([{
        user_id: userId,
        name: 'Messaging',
        surname: 'Test',
        email: `msg_${userId.slice(0, 5)}@example.com`,
        birth_date: '1985-05-05',
        gender: 'F',
        username: `msg_user_${userId.slice(0, 8)}`,
    }]).select().single();

    const { data: notification } = await supabaseClient.from('PatientNotifications').insert([{
        patient_id: patient!.id,
        subject: 'Initial Seed Subject',
        content: 'This is a test notification content',
        is_read: false,
        created_at: new Date().toISOString()
    }]).select().single();

    return {
        patientId: patient!.id,
        patientUserId: userId,
        notificationId: notification!.id
    };
}