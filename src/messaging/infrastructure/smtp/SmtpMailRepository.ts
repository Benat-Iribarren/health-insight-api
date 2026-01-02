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

    private getProfessionalTemplate(body: string): string {
        return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        .email-wrapper { background-color: #f4f7f9; padding: 40px 10px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .email-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .email-header { background: linear-gradient(135deg, #1a2a6c, #2a4858); padding: 35px 20px; text-align: center; }
        .email-header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; }
        .email-body { padding: 40px 35px; color: #444444; line-height: 1.8; }
        .professional-intro { color: #1a2a6c; font-weight: 600; font-size: 18px; margin-bottom: 20px; }
        .message-content { background: #fdfdfd; border: 1px solid #edf2f7; border-left: 5px solid #3498db; padding: 25px; border-radius: 4px; color: #2d3748; font-style: italic; margin: 30px 0; }
        .cta-container { text-align: center; margin: 40px 0 20px; }
        .cta-button { background-color: #3498db; color: #ffffff !important; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; transition: background 0.3s; }
        .email-footer { background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #edf2f7; }
        .footer-text { font-size: 12px; color: #94a3b8; margin: 5px 0; }
        .confidential-notice { font-size: 10px; color: #cbd5e1; margin-top: 20px; line-height: 1.4; text-align: justify; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">
          <div class="email-header">
            <h1>Health Insight</h1>
          </div>
          <div class="email-body">
            <div class="professional-intro">Nueva comunicación de su especialista</div>
            <p>Estimado/a paciente,</p>
            <p>Le informamos que se ha registrado una nueva indicación o comentario en su expediente clínico digital. Su especialista ha compartido la siguiente información con usted:</p>
            
            <div class="message-content">
              "${body}"
            </div>

            <p>Para ver los detalles completos, adjuntos o responder a esta comunicación, por favor acceda a su área privada de salud.</p>
            
            <div class="cta-container">
              <a href="${process.env.FRONTEND_URL || '#'}" class="cta-button">Acceder al Portal del Paciente</a>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-text"><strong>Health Insight API</strong> | Centro de Telerehabilitación Avanzada</p>
            <p class="footer-text">© 2026 Sistema de Gestión Clínica Digital</p>
            <div class="confidential-notice">
              <strong>AVISO DE CONFIDENCIALIDAD:</strong> Este mensaje contiene información de salud protegida y está destinado únicamente al destinatario indicado. Si usted no es el destinatario original, sepa que cualquier divulgación, copia o distribución está estrictamente prohibida bajo la Ley de Protección de Datos Personales y Garantía de Derechos Digitales.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    }

    async send(to: string, subject: string, body: string): Promise<void> {
        await this.transporter.sendMail({
            from: `"Health Insight Professional" <${process.env.SMTP_USER}>`,
            to,
            subject: `Notificación Clínica: ${subject}`,
            html: this.getProfessionalTemplate(body)
        });
    }
}