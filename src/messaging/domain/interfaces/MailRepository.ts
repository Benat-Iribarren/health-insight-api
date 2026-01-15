export interface MailRepository {
    send(
        to: string,
        subject: string,
        body: string,
        pendingCount?: number,
        stats?: any,
        imageBuffer?: Buffer
    ): Promise<any>;
}