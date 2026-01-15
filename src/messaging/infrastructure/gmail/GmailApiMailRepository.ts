import { google } from 'googleapis';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { HtmlImageGenerator } from '../images/HtmlImageGenerator';

export class GmailApiMailRepository implements MailRepository {
    private oauth2Client;
    private imageGenerator: HtmlImageGenerator;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        this.oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });
        this.imageGenerator = new HtmlImageGenerator();
    }

    private getMasterLayout(content: string): string {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"></head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 50px 20px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase;">HEALTH INSIGHT</h1>
                                    <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">Tu compañero en telerehabilitación</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 45px 40px; color: #1e293b;">
                                    ${content}
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 13px; color: #64748b; margin: 0; font-weight: 600;">Health Insight API | Centro de Telerehabilitación</p>
                                    <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">Este es un mensaje automático procesado para tu seguimiento clínico.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`;
    }

    private getStatsHtml(stats: any): string {
        return `
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="margin-bottom: 10px;">
                <img src="cid:weekly-donut" width="320" alt="Tu Progreso" style="display: block; margin: 0 auto; max-width: 100%;">
            </div>
            <h2 style="color: #1e3a8a; font-size: 24px; margin: 0; font-weight: 700;">Tu Evolución Semanal</h2>
            <p style="color: #64748b; font-size: 16px; margin-top: 5px;">¡Sigue así! Estás cumpliendo tus metas.</p>
        </div>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 20px; margin-bottom: 40px; border: 1px solid #e2e8f0;">
            <tr>
                <td align="center" style="padding: 30px; border-right: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 32px; font-weight: 800; color: #10b981;">${stats.completed}</span>
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Completadas</span>
                </td>
                <td align="center" style="padding: 30px; border-right: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 32px; font-weight: 800; color: #f59e0b;">${stats.inProgress}</span>
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">En curso</span>
                </td>
                <td align="center" style="padding: 30px;">
                    <span style="display: block; font-size: 32px; font-weight: 800; color: #ef4444;">${stats.notStarted}</span>
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Pendientes</span>
                </td>
            </tr>
        </table>

        <div style="text-align: center;">
            <a href="https://digital-therapy-platform.web.app/dashboard" 
               style="background: linear-gradient(to bottom, #10b981 0%, #059669 100%); color: #ffffff; padding: 20px 45px; text-decoration: none; border-radius: 60px; font-weight: 800; display: inline-block; font-size: 15px; letter-spacing: 1px; border-bottom: 4px solid #047857; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);">
               VER MI PANEL COMPLETO
            </a>
        </div>`;
    }

    async send(to: string, subject: string, body: string, pendingCount: number = 1, stats?: any): Promise<{ success: boolean }> {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        const mainContent = stats ? this.getStatsHtml(stats) : body;
        const htmlContent = this.getMasterLayout(mainContent);

        const boundary = "__HEALTH_INSIGHT_BOUNDARY__";
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

        let message = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/related; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset=utf-8',
            'Content-Transfer-Encoding: base64',
            '',
            Buffer.from(htmlContent).toString('base64'),
            ''
        ].join('\r\n');

        if (stats) {
            const imageBuffer = await this.imageGenerator.generateWeeklyDashboard(stats);
            message += [
                `--${boundary}`,
                'Content-Type: image/png',
                'Content-Transfer-Encoding: base64',
                'Content-ID: <weekly-donut>',
                'Content-Disposition: inline; filename="stats.png"',
                '',
                imageBuffer.toString('base64'),
                ''
            ].join('\r\n');
        }

        message += `--${boundary}--`;

        const raw = Buffer.from(message)
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