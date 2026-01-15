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
        this.oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
        this.imageGenerator = new HtmlImageGenerator();
    }

    private getMasterLayout(content: string): string {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"></head>
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
        const total = (stats.completed + stats.inProgress + stats.notStarted) || 1;
        const progress = Math.round((stats.completed / total) * 100);

        return `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="margin-bottom: 20px;">
                <img src="cid:weekly-donut" width="300" alt="Tu Evolución" style="display: block; margin: 0 auto; max-width: 100%;">
            </div>
            <h2 style="color: #1a2a6c; font-size: 24px; margin-bottom: 8px; font-weight: bold;">Tu Evolución Semanal</h2>
            <p style="color: #64748b; margin: 0; font-size: 16px;">¡Sigue así! Estás cumpliendo tus metas.</p>
        </div>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 30px; margin-bottom: 40px; border-collapse: separate;">
            <tr>
                <td align="center" style="padding: 35px 10px; border-right: 1px solid #e2e8f0; width: 33%;">
                    <span style="display: block; font-size: 36px; font-weight: 800; color: #10b981; margin-bottom: 5px;">${stats.completed}</span>
                    <span style="font-size: 12px; color: #475569; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Completadas</span>
                </td>
                <td align="center" style="padding: 35px 10px; border-right: 1px solid #e2e8f0; width: 33%;">
                    <span style="display: block; font-size: 36px; font-weight: 800; color: #f59e0b; margin-bottom: 5px;">${stats.inProgress}</span>
                    <span style="font-size: 12px; color: #475569; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">En curso</span>
                </td>
                <td align="center" style="padding: 35px 10px; width: 33%;">
                    <span style="display: block; font-size: 36px; font-weight: 800; color: #ef4444; margin-bottom: 5px;">${stats.notStarted}</span>
                    <span style="font-size: 12px; color: #475569; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Pendientes</span>
                </td>
            </tr>
        </table>

        <div style="text-align: center;">
            <a href="https://digital-therapy-platform.web.app/dashboard" 
               style="background: linear-gradient(to bottom, #10b981 0%, #059669 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 14px; border-bottom: 4px solid #047857; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
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