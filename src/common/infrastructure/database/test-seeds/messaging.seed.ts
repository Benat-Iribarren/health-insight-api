import { supabaseClient } from '../supabaseClient';
import { randomUUID } from 'node:crypto';
import { MessagingContext, generateUniqueEmail } from './types';

export async function seedMessagingContext(): Promise<MessagingContext> {
    const userId = randomUUID();
    const email = generateUniqueEmail('msg');

    const { data: patient } = await supabaseClient
        .from('Patient')
        .insert([
            {
                user_id: userId,
                name: 'Messaging',
                surname: 'Test',
                email: email,
                birth_date: '1985-05-05',
                gender: 'F',
                username: `msg_user_${userId.slice(0, 8)}`,
            },
        ])
        .select()
        .single();

    const { data: session } = await supabaseClient
        .from('Session')
        .insert([
            {
                number: 1,
                day_offset: 0,
            },
        ])
        .select()
        .single();

    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() - 1);

    await supabaseClient.from('PatientSession').insert([
        {
            session_id: session!.id,
            patient_id: patient!.id,
            state: 'completed',
            assigned_date: sessionDate.toISOString(),
            pre_evaluation: 2,
            post_evaluation: 6,
        },
    ]);

    const { data: notification } = await supabaseClient
        .from('PatientNotifications')
        .insert([
            {
                patient_id: patient!.id,
                subject: 'Initial Seed Subject',
                content: 'This is a test notification content',
                is_read: false,
                is_deleted: false,
                created_at: new Date().toISOString(),
            },
        ])
        .select()
        .single();

    return {
        patientId: patient!.id,
        patientUserId: userId,
        notificationId: notification!.id,
        sessionId: session!.id,
        email: email,
    };
}

export const initMessagingTestDatabase = seedMessagingContext;