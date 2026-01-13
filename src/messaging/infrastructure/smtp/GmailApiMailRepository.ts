import { google } from 'googleapis';
import { MailRepository } from '../../domain/interfaces/MailRepository';

export class GmailApiMailRepository implements MailRepository {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI
        );
        this.oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });
    }

    async send(to: string, subject: string, body: string, stats?: any, imageBuffer?: Buffer): Promise<any> {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        const boundary = 'foo_bar_baz';
        const utf8Subject = `=?utf-8?B?${Buffer.from(`Health Insight | ${subject}`).toString('base64')}?=`;

        let messageParts = [
            `From: "Health Insight Professional" <${process.env.SMTP_USER}>`,
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/related; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset=utf-8',
            'Content-Transfer-Encoding: bit8',
            '',
            body,
            ''
        ];

        if (imageBuffer) {
            messageParts.push(
                `--${boundary}`,
                'Content-Type: image/png',
                'Content-Transfer-Encoding: base64',
                'Content-ID: <weekly-chart>',
                'Content-Disposition: inline; filename="stats-chart.png"',
                '',
                imageBuffer.toString('base64'),
                ''
            );
        }

        messageParts.push(`--${boundary}--`);

        const raw = Buffer.from(messageParts.join('\n'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        try {
            const res = await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw }
            });
            return { success: true, messageId: res.data.id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}