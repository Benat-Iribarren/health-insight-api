import { google } from 'googleapis';
import { MailRepository } from '../../domain/interfaces/MailRepository';

export class GmailApiMailRepository implements MailRepository {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        this.oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });
    }

    private generateEmailHtml(pendingCount: number): string {
        const message = pendingCount === 1
            ? "Tienes 1 mensaje nuevo de tu profesional de salud."
            : `Tienes ${pendingCount} mensajes nuevos de tu profesional de salud.`;

        return `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #1a2a6c;">Health Insight</h2>
            <p>${message}</p>
            <p>Por favor, accede a la plataforma para leer el contenido completo de forma segura.</p>
            <div style="margin-top: 30px;">
                <a href="https://health-insight-web.vercel.app" 
                   style="background-color: #1a2a6c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Acceder a la Web
                </a>
            </div>
            <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #888;">Este es un aviso automático, por favor no respondas a este correo.</p>
        </div>`;
    }

    async send(to: string, subject: string, body: string, pendingCount: number = 1): Promise<{ success: boolean }> {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        const htmlContent = this.generateEmailHtml(pendingCount);

        const utf8Subject = `=?utf-8?B?${Buffer.from(`Health Insight | ${subject}`).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            htmlContent
        ];

        const raw = Buffer.from(messageParts.join('\n'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        try {
            await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
            return { success: true };
        } catch (error) {
            console.error('Gmail API Error:', error);
            return { success: false };
        }
    }
}