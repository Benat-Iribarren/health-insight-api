export interface OutboxMessage {
    patientId: number;
    type: 'WEEKLY_STATS' | 'DROPOUT_ALERT' | 'DIRECT_MESSAGE';
    payload: {
        email: string;
        subject: string;
        body?: string;
        stats?: {
            patientName: string;
            completed: number;
            inProgress: number;
            notStarted: number;
            nextWeekSessions: number;
        };
    };
}

export interface OutboxRepository {
    save(message: OutboxMessage): Promise<void>;
}