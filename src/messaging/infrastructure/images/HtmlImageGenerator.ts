import nodeHtmlToImage from "node-html-to-image";

export class HtmlImageGenerator {
    async generateWeeklyDashboard(stats: any): Promise<Buffer> {
        const total = (stats.completed + stats.inProgress + stats.notStarted) || 1;
        const completedPct = Math.round((stats.completed / total) * 100);
        const inProgressPct = Math.round((stats.inProgress / total) * 100);
        const inProgressEnd = completedPct + inProgressPct;

        const isPerfect = completedPct === 100;
        const statusLabel = isPerfect ? "🏆 ¡Objetivo Cumplido!" : "Progreso de Adherencia";
        const accentColor = isPerfect ? "#f59e0b" : "#1a2a6c";

        return await nodeHtmlToImage({
            transparent: true,
            puppeteerArgs: {
                executablePath: process.env.NODE_ENV === 'production'
                    ? '/usr/bin/google-chrome'
                    : undefined,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            },
            html: `
      <html>
        <head>
          <style>
            body { width: 500px; height: 400px; font-family: sans-serif; background: #ffffff; display: flex; justify-content: center; align-items: center; margin: 0; }
            .chart-container { text-align: center; padding: 20px; }
            .donut-chart {
              width: 180px; height: 180px; border-radius: 50%;
              background: conic-gradient(#10b981 0% ${completedPct}%, #f59e0b ${completedPct}% ${inProgressEnd}%, #e2e8f0 ${inProgressEnd}% 100%);
              display: flex; align-items: center; justify-content: center; margin: 0 auto 30px auto;
            }
            .donut-inner { width: 135px; height: 135px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .pct-main-text { font-size: 52px; font-weight: bold; color: ${accentColor}; }
            .status-badge { font-size: 34px; font-weight: 800; color: ${accentColor}; }
          </style>
        </head>
        <body>
          <div class="chart-container">
            <div class="donut-chart"><div class="donut-inner"><span class="pct-main-text">${completedPct}%</span></div></div>
            <span class="status-badge">${statusLabel}</span>
          </div>
        </body>
      </html>`
        }) as Buffer;
    }
}