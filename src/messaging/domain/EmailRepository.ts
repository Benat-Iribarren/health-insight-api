export interface SendEmailCommand {
    patientId: string;
    subject: string;
    body: string;
}

export interface EmailRepository {
    send(to: string, subject: string, body: string): Promise<void>;
}