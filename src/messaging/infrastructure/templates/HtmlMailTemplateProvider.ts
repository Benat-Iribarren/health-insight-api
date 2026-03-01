import { MailTemplateProvider } from '../../domain/interfaces/MailTemplateProvider';

export class HtmlMailTemplateProvider implements MailTemplateProvider {
    renderWeeklyStats(stats: {
        completed: number;
        inProgress: number;
        pending: number;
        nextWeekSessions: number;
        name: string;
    }): string {
        const sessionsText =
            stats.nextWeekSessions === 1 ? '1 sesión programada' : `${stats.nextWeekSessions} sesiones programadas`;

        return `
            <div style="text-align:center;margin-bottom:30px">
                <div style="margin-bottom:20px">
                    <img src="cid:stats" width="220" alt="Tu Evolución" style="display:block;margin:0 auto;max-width:100%">
                </div>
                <h2 style="color:#1e1b4b;font-size:24px;font-weight:700;margin-bottom:10px">Tu Resumen Semanal</h2>
                <p style="color:#475569;font-size:16px;margin:0">Hola <strong>${stats.name}</strong>, este es el balance de tu actividad terapéutica:</p>
            </div>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border-radius:12px;margin-bottom:25px">
                <tbody>
                    <tr>
                        <td align="center" style="padding:30px 10px;border-right:1px solid #e2e8f0">
                            <span style="display:block;font-size:32px;font-weight:bold;color:#059669">${stats.completed}</span>
                            <span style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600">Hechas</span>
                        </td>
                        <td align="center" style="padding:30px 10px;border-right:1px solid #e2e8f0">
                            <span style="display:block;font-size:32px;font-weight:bold;color:#d97706">${stats.inProgress}</span>
                            <span style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600">En curso</span>
                        </td>
                        <td align="center" style="padding:30px 10px">
                            <span style="display:block;font-size:32px;font-weight:bold;color:#dc2626">${stats.pending}</span>
                            <span style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600">Pendientes</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style="border:2px dashed #cbd5e1;border-radius:12px;padding:25px;text-align:center;margin-bottom:35px">
                <p style="color:#475569;font-size:14px;margin:0 0 8px 0">Planificación para la próxima semana:</p>
                <p style="color:#1e1b4b;font-size:20px;font-weight:800;margin:0">${sessionsText}</p>
            </div>

            <div style="text-align:center">
                <a href="https://digital-therapy-platform.web.app/patient/dashboard" style="background-color:#10b981;color:#ffffff;padding:16px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:15px" target="_blank">
                    VER PANEL DETALLADO
                </a>
            </div>`;
    }

    renderMessageNotification(count: number): string {
        const text = count === 1 ? "Tienes 1 mensaje nuevo sin leer" : `Tienes ${count} mensajes nuevos sin leer`;
        return `
            <div style="text-align:center">
                <h2 style="color:#1a2a6c;font-size:22px;margin-top:0;margin-bottom:30px">Nueva actividad en tu panel</h2>
                <div style="background-color:#f1f5f9;border-left:4px solid #1a2a6c;padding:25px;border-radius:4px;margin:30px 0">
                    <span style="display:block;color:#1e40af;font-size:20px;font-weight:600">
                        ${text}
                    </span>
                </div>
                <p style="color:#64748b;font-size:15px;line-height:1.6;margin-bottom:35px">
                    Tu especialista ha actualizado tu seguimiento. Accede a la plataforma para revisar los nuevos mensajes.
                </p>
                <a href="https://digital-therapy-platform.web.app" style="background:linear-gradient(to bottom,#10b981 0%,#059669 100%);color:#ffffff;padding:18px 36px;text-decoration:none;border-radius:50px;font-weight:700;display:inline-block;font-size:14px;letter-spacing:1px;border-bottom:4px solid #047857" target="_blank">
                   ACCEDER A MIS MENSAJES
                </a>
            </div>`;
    }
}