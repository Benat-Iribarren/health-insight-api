import nodeHtmlToImage from "node-html-to-image";
import fs from 'fs';

export class HtmlImageGenerator {
    async generateWeeklyDashboard(stats: any): Promise<Buffer> {
        const total = (stats.completed + stats.inProgress + stats.notStarted) || 1;
        const completedPct = Math.round((stats.completed / total) * 100);
        const inProgressPct = Math.round((stats.inProgress / total) * 100);
        const inProgressEnd = completedPct + inProgressPct;

        const isPerfect = completedPct === 100;
        const statusLabel = isPerfect ? "🏆 ¡Objetivo Cumplido!" : "Progreso de Adherencia";

        // Cambiamos el color de acento a amarillo (#f59e0b) si es 100%
        const accentColor = isPerfect ? "#f59e0b" : "#10b981";

        return await nodeHtmlToImage({
            // ... (resto de la configuración igual)
            html: `
      <html>
        <head>
          <style>
            /* ... estilos anteriores ... */
            .donut-chart {
              width: 180px; height: 180px; border-radius: 50%;
              /* Usamos accentColor para el tramo completado */
              background: conic-gradient(${accentColor} 0% ${completedPct}%, #f59e0b ${completedPct}% ${inProgressEnd}%, #e2e8f0 ${inProgressEnd}% 100%);
              display: flex; align-items: center; justify-content: center; margin: 0 auto 30px auto;
            }
            /* ... resto de estilos ... */
          </style>
        </head>
        <body>
          <div class="chart-container">
            <div class="donut-chart"><div class="donut-inner"><span class="pct-main-text">${completedPct}%</span></div></div>
            <span class="status-badge" style="color: ${accentColor}">${statusLabel}</span>
          </div>
        </body>
      </html>`
        }) as Buffer;
    }
}