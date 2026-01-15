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
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" style="padding: 40px 10px;">
                        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
                            <tr>
                                <td style="background: linear-gradient(135deg, #1a2a6c, #2a4858); padding: 40px 20px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase;">Health Insight</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 45px 35px; color: #334155;">
                                    ${content}
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 12px; color: #94a3b8; margin: 0;"><strong>Health Insight API</strong> | Centro de Telerehabilitación</p>
                                    <p style="font-size: 10px; color: #cbd5e1; margin-top: 15px; line-height: 1.4;">Este es un mensaje automático, por favor no responda a este correo.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`;
    }

    private getNotificationContent(pendingCount: number): string {
        const countText = pendingCount > 1
            ? `Tienes ${pendingCount} mensajes nuevos sin leer`
            : `Tienes 1 mensaje nuevo sin leer`;

        return `
        <div style="text-align: center;">
            <h2 style="color: #1a2a6c; font-size: 22px; margin-top: 0; margin-bottom: 30px;">Nueva actividad en tu panel</h2>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid #1a2a6c; padding: 25px; border-radius: 4px; margin: 30px 0;">
                <span style="display: block; color: #1e40af; font-size: 20px; font-weight: 600;">
                    ${countText}
                </span>
            </div>

            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 35px;">
                Tu especialista ha actualizado tu seguimiento. Accede a la plataforma para revisar los nuevos mensajes y continuar con tu progreso.
            </p>

            <a href="https://health-insight-web.vercel.app/notifications" 
               style="background: linear-gradient(to bottom, #10b981 0%, #059669 100%); color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 14px; letter-spacing: 1px; border-bottom: 4px solid #047857; box-shadow: 0 4px 0 #047857, 0 8px 15px rgba(0, 0, 0, 0.15); transition: all 0.2s ease;">
               ACCEDER A MIS MENSAJES
            </a>
        </div>`;
    }

    private getStatsHtml(stats: any): string {
        const total = (stats.completed + stats.inProgress + stats.notStarted) || 1;
        const progress = Math.round((stats.completed / total) * 100);

        return `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1a2a6c; font-size: 22px; margin-bottom: 10px;">Tu Progreso Semanal</h2>
            <p style="color: #64748b; margin: 0;">Has completado el <strong>${progress}%</strong> de tus objetivos.</p>
        </div>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 35px;">
            <tr>
                <td align="center" style="padding: 25px; border-right: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 28px; font-weight: bold; color: #10b981;">${stats.completed}</span>
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Hechas</span>
                </td>
                <td align="center" style="padding: 25px; border-right: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 28px; font-weight: bold; color: #f59e0b;">${stats.inProgress}</span>
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">En curso</span>
                </td>
                <td align="center" style="padding: 25px;">
                    <span style="display: block; font-size: 28px; font-weight: bold; color: #ef4444;">${stats.notStarted}</span>
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Pendientes</span>
                </td>
            </tr>
        </table>

        <div style="text-align: center;">
            <a href="https://health-insight-web.vercel.app/dashboard" 
               style="background: linear-gradient(to bottom, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 14px; border-bottom: 4px solid #047857; box-shadow: 0 4px 0 #047857, 0 8px 15px rgba(0, 0, 0, 0.15);">
               VER PANEL DETALLADO
            </a>
        </div>`;
    }

    async send(to: string, subject: string, body: string, pendingCount: number = 1, stats?: any): Promise<{ success: boolean }> {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        const mainContent = stats
            ? this.getStatsHtml(stats)
            : this.getNotificationContent(pendingCount);

        const htmlContent = this.getMasterLayout(mainContent);

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
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
            console.error('Gmail API Send Error:', error);
            return { success: false };
        }
    }
}