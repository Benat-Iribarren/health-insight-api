import { google } from 'googleapis';
import { InlineAttachment, MailRepository } from '../../domain/interfaces/MailRepository';

export class GmailApiMailRepository implements MailRepository {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        this.oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        });
    }

    private getMasterLayout(content: string): string {
        return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f9; font-family: sans-serif;">
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
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>`;
    }

    async sendMail(input: {
        to: string;
        subject: string;
        html: string;
        inlineAttachments?: InlineAttachment[];
    }): Promise<void> {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        const boundary = '__boundary_string__';
        const htmlContent = this.getMasterLayout(input.html);
        const utf8Subject = `=?utf-8?B?${Buffer.from(input.subject).toString('base64')}?=`;

        let rawMessage = [
            `To: ${input.to}`,
            `Subject: ${utf8Subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/related; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            `Content-Type: text/html; charset=utf-8`,
            `Content-Transfer-Encoding: base64`,
            '',
            Buffer.from(htmlContent).toString('base64'),
            '',
        ].join('\r\n');

        for (const a of input.inlineAttachments ?? []) {
            rawMessage += [
                `--${boundary}`,
                `Content-Type: ${a.contentType}`,
                `Content-Transfer-Encoding: base64`,
                `Content-ID: <${a.contentId}>`,
                `Content-Disposition: inline; filename="${a.filename}"`,
                '',
                a.content.toString('base64'),
                '',
            ].join('\r\n');
        }

        rawMessage += `--${boundary}--`;

        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });
    }
}