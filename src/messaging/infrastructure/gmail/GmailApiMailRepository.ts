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

    private getMasterLayout(content: string): string {
        return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f9;">
            <tr>
                <td align="center" style="padding:40px 10px">
                    <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
                        <tbody>
                            <tr>
                                <td style="background:linear-gradient(135deg,#1a2a6c,#2a4858);padding:40px 20px;text-align:center">
                                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:300;letter-spacing:3px;text-transform:uppercase">Health Insight</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:45px 35px;color:#334155">
                                    ${content}
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color:#f8fafc;padding:25px;text-align:center;border-top:1px solid #e2e8f0">
                                    <p style="font-size:12px;color:#94a3b8;margin:0"><strong>Health Insight API</strong> | Centro de Telerehabilitación</p>
                                    <p style="font-size:10px;color:#cbd5e1;margin-top:15px;line-height:1.4">Este es un mensaje automático, por favor no responda a este correo.</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>`;
    }

    private getMessageNotificationHtml(count: number): string {
        const text = count === 1
            ? "Tienes 1 mensaje nuevo sin leer"
            : `Tienes ${count} mensajes nuevos sin leer`;

        return `
        <div style="text-align:center">
            <h2 style="color:#1a2a6c;font-size:22px;margin-top:0;margin-bottom:30px">Nueva actividad en tu panel</h2>
            
            <div style="background-color:#f1f5f9;border-left:4px solid #1a2a6c;padding:25px;border-radius:4px;margin:30px 0">
                <span style="display:block;color:#1e40af;font-size:20px;font-weight:600">
                    ${text}
                </span>
            </div>

            <p style="color:#64748b;font-size:15px;line-height:1.6;margin-bottom:35px">
                Tu especialista ha actualizado tu seguimiento. Accede a la plataforma para revisar los nuevos mensajes.
            </p>

            <a href="https://digital-therapy-platform.web.app" style="background:linear-gradient(to bottom,#10b981 0%,#059669 100%);color:#ffffff;padding:18px 36px;text-decoration:none;border-radius:50px;font-weight:700;display:inline-block;font-size:14px;letter-spacing:1px;border-bottom:4px solid #047857" target="_blank">
               ACCEDER A MIS MENSAJES
            </a>
        </div>`;
    }

    async send(to: string, subject: string, body: string, pendingCount: number = 0): Promise<{ success: boolean }> {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        const content = this.getMessageNotificationHtml(pendingCount);
        const htmlContent = this.getMasterLayout(content);

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            `Content-Type: text/html; charset=utf-8`,
            `MIME-Version: 1.0`,
            `Subject: ${utf8Subject}`,
            '',
            htmlContent
        ];

        const raw = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        try {
            await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }
}