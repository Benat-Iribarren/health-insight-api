export interface OutboxMessage {
    patientId: number;
    type: 'WEEKLY_STATS' | 'DROPOUT_ALERT';
    payload: any;
}

export interface OutboxRepository {
    save(message: OutboxMessage): Promise<void>;
}