export interface MailRepository {
    send(
        to: string,
        subject: string,
        body: string,
        stats?: any,
        imageBuffer?: Buffer
    ): Promise<void>;
}