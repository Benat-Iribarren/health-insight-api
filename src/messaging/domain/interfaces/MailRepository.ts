export interface MailRepository {
    send(to: string, subject: string, body: string): Promise<void>;
}
