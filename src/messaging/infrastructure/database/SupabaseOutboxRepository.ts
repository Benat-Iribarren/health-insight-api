import { OutboxRepository, OutboxMessage } from '../../domain/interfaces/OutboxRepository';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

export class SupabaseOutboxRepository implements OutboxRepository {
    constructor(private readonly supabase: DBClientService) {}

    async save(message: OutboxMessage): Promise<void> {
        const { error } = await this.supabase
            .from('MessagingOutbox')
            .insert({
                patient_id: message.patientId,
                type: message.type,
                payload: message.payload,
                status: 'PENDING'
            });

        if (error) {
            throw new Error('FAILED_TO_QUEUE_MESSAGE');
        }
    }
}