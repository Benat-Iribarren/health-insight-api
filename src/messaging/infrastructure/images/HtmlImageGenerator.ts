import nodeHtmlToImage from "node-html-to-image";

export class HtmlImageGenerator {
    async generateWeeklyDashboard(stats: any): Promise<Buffer> {
        const total = (stats.completed + stats.inProgress + stats.notStarted) || 1;
        const completedPct = Math.round((stats.completed / total) * 100);
        const inProgressPct = Math.round((stats.inProgress / total) * 100);
        const inProgressEnd = completedPct + inProgressPct;

        return await nodeHtmlToImage({
            transparent: true,
            puppeteerArgs: {
                executablePath: '/usr/bin/google-chrome',
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
            body { width: 500px; height: 300px; font-family: 'Helvetica', sans-serif; background: #ffffff; display: flex; justify-content: center; align-items: center; }
            .chart-container { text-align: center; }
            .donut-chart {
              width: 180px; height: 180px; border-radius: 50%;
              background: conic-gradient(
                #10b981 0% ${completedPct}%, 
                #f59e0b ${completedPct}% ${inProgressEnd}%, 
                #e2e8f0 ${inProgressEnd}% 100%
              );
              display: flex; align-items: center; justify-content: center; margin: 0 auto;
            }
            .donut-inner {
              width: 130px; height: 130px; background: #ffffff; border-radius: 50%;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
            }
            .pct-text { font-size: 32px; font-weight: bold; color: #1a2a6c; }
            .label-text { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="chart-container">
            <div class="donut-chart">
              <div class="donut-inner">
                <span class="pct-text">${completedPct}%</span>
                <span class="label-text">Adherencia</span>
              </div>
            </div>
          </div>
        </body>
      </html>`
        }) as Buffer;
    }
}