import nodemailer from 'nodemailer';
import { MailRepository } from '../../domain/interfaces/MailRepository';

export class SmtpMailRepository implements MailRepository {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
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
    <body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Helvetica', Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border-collapse: collapse; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              <tr>
                <td style="background: linear-gradient(135deg, #1a2a6c, #2a4858); padding: 35px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">Health Insight</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 35px; color: #444444; line-height: 1.8;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #edf2f7;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;"><strong>Health Insight API</strong> | Centro de Telerehabilitación</p>
                  <p style="font-size: 10px; color: #cbd5e1; margin-top: 20px; text-align: justify; line-height: 1.4;">AVISO DE CONFIDENCIALIDAD: Este mensaje contiene información de salud protegida y está destinado únicamente al destinatario.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
    }

    private getWeeklyStatsContent(stats: any): string {
        return `
    <div style="color: #1a2a6c; font-weight: 600; font-size: 20px; margin-bottom: 20px; text-align: center;">Tu Resumen Semanal</div>
    <p style="text-align: center;">Hola <strong>${stats.patientName}</strong>, este es el balance de tu actividad terapéutica:</p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0; background-color: #f8fafc; border: 1px solid #edf2f7; border-radius: 10px;">
      <tr>
        <td align="center" style="padding: 20px; border-right: 1px solid #edf2f7;">
          <span style="display: block; font-size: 32px; font-weight: bold; color: #10b981;">${stats.completed}</span>
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Hechas</span>
        </td>
        <td align="center" style="padding: 20px; border-right: 1px solid #edf2f7;">
          <span style="display: block; font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.inProgress}</span>
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">En curso</span>
        </td>
        <td align="center" style="padding: 20px;">
          <span style="display: block; font-size: 32px; font-weight: bold; color: #ef4444;">${stats.notStarted}</span>
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Pendientes</span>
        </td>
      </tr>
    </table>

    <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; text-align: center;">
      <p style="margin: 0; color: #475569;">Planificación para la próxima semana: <br>
      <strong style="font-size: 18px; color: #1a2a6c;">${stats.nextWeekSessions} sesiones programadas</strong></p>
    </div>`;
    }

    private getMessageContent(body: string): string {
        return `
    <div style="background: #fdfdfd; border-left: 5px solid #3498db; padding: 25px; margin: 10px 0; color: #2d3748; font-size: 16px;">
      ${body}
    </div>`;
    }

    async send(to: string, subject: string, body: string, stats?: any, imageBuffer?: Buffer): Promise<void> {
        let htmlContent = "";
        let attachments: any[] = [];

        if (stats && imageBuffer) {
            htmlContent = this.getMasterLayout(this.getWeeklyStatsContent(stats));
            attachments = [{
                filename: 'stats-chart.png',
                content: imageBuffer,
                cid: 'weekly-chart'
            }];
        } else {
            htmlContent = this.getMasterLayout(this.getMessageContent(body));
        }

        await this.transporter.sendMail({
            from: `"Health Insight Professional" <${process.env.SMTP_USER}>`,
            to,
            subject: `Health Insight | ${subject}`,
            html: htmlContent,
            attachments
        });
    }
}