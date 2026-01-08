export interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

export interface MailRepository {
    send(to: string, subject: string, body: string, stats?: any, imageBuffer?: Buffer): Promise<any>;
}