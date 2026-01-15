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
        <head><meta charset="UTF-8"></head>
        <body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" style="padding: 40px 10px;">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #1a2a6c, #2a4858); padding: 35px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase;">Health Insight</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 35px; color: #444444; line-height: 1.8;">
                      ${content}
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
        <div style="color: #1a2a6c; font-weight: 600; font-size: 20px; margin-bottom: 20px; text-align: center;">Tu Resumen Semanal</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0; background-color: #f8fafc; border: 1px solid #edf2f7; border-radius: 10px;">
          <tr>
            <td align="center" style="padding: 20px; border-right: 1px solid #edf2f7;">
              <span style="display: block; font-size: 32px; font-weight: bold; color: #10b981;">${stats.completed}</span>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase;">Hechas</span>
            </td>
            <td align="center" style="padding: 20px; border-right: 1px solid #edf2f7;">
              <span style="display: block; font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.inProgress}</span>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase;">En curso</span>
            </td>
            <td align="center" style="padding: 20px;">
              <span style="display: block; font-size: 32px; font-weight: bold; color: #ef4444;">${stats.notStarted}</span>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase;">Pendientes</span>
            </td>
          </tr>
        </table>`;
    }

    async send(to: string, subject: string, body: string, pendingCount: number = 1, stats?: any): Promise<{ success: boolean }> {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        const content = stats ? this.getStatsHtml(stats) : `<p>${body}</p><p>Tienes ${pendingCount} mensajes pendientes.</p>`;
        const htmlContent = this.getMasterLayout(content);

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
            return { success: false };
        }
    }
}