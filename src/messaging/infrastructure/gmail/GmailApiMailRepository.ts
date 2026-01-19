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
        <body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Segoe UI', Arial, sans-serif;">
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
                                <td style="padding: 45px 35px; color: #334155;">${content}</td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 12px; color: #94a3b8; margin: 0;"><strong>Health Insight API</strong> | Centro de Telerehabilitación</p>
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
        const nextWeekCount = stats.nextWeekCount || 0;

        return `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="margin-bottom: 20px;">
                <img src="cid:weekly-donut" width="220" alt="Progreso" style="display: block; margin: 0 auto; max-width: 100%;">
            </div>
            <h2 style="color: #1e1b4b; font-size: 24px; font-weight: 700; margin-bottom: 10px;">Tu Resumen Semanal</h2>
            <p style="color: #475569; font-size: 16px; margin: 0;">Hola <strong>${stats.name || 'Beñat'}</strong>, este es el balance de tu actividad terapéutica:</p>
        </div>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 25px;">
            <tr>
                <td align="center" style="padding: 30px 10px; border-right: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 32px; font-weight: bold; color: #059669;">${stats.completed}</span>
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Hechas</span>
                </td>
                <td align="center" style="padding: 30px 10px; border-right: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 32px; font-weight: bold; color: #d97706;">${stats.inProgress}</span>
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">En curso</span>
                </td>
                <td align="center" style="padding: 30px 10px;">
                    <span style="display: block; font-size: 32px; font-weight: bold; color: #dc2626;">${stats.notStarted}</span>
                    <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Pendientes</span>
                </td>
            </tr>
        </table>

        <div style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 35px;">
            <p style="color: #475569; font-size: 14px; margin: 0 0 8px 0;">Planificación para la próxima semana:</p>
            <p style="color: #1e1b4b; font-size: 20px; font-weight: 800; margin: 0;">${nextWeekCount} sesiones programadas</p>
        </div>

        <div style="text-align: center;">
            <a href="https://digital-therapy-platform.web.app/dashboard" 
               style="background-color: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 15px;">
               VER PANEL DETALLADO
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
            '',
            htmlContent,
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
        const raw = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        try {
            await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }
}