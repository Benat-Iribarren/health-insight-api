import 'dotenv/config';
import nodemailer from 'nodemailer';
import { EmailRepository } from '../domain/EmailRepository';

export class NodemailerEmailRepository implements EmailRepository {
    private readonly transporter: nodemailer.Transporter;

    constructor() {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('SMTP_CREDENTIALS_MISSING');
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async send(to: string, subject: string, body: string): Promise<void> {
        await this.transporter.sendMail({
            from: `"Profesional Sanitario" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text: body,
            html: this.getProfessionalTemplate(body),
        });
    }

    private getProfessionalTemplate(content: string): string {
        return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border-top: 4px solid #007bff; padding: 20px; color: #333;">
        <h2 style="color: #007bff;">Mensaje de tu Especialista</h2>
        <div style="font-size: 16px; line-height: 1.6; color: #444;">
          ${content}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #888;">
          <p>Enviado desde la plataforma HealthInsight</p>
        </div>
      </div>
    `;
    }
}
