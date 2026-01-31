export interface MailRepository {
    send(
        to: string,
        subject: string,
        content: string,
        pendingCount: number,
        attachment?: Buffer
    ): Promise<{ success: boolean }>;
}
