import nodeHtmlToImage from 'node-html-to-image';
import fs from 'fs';
import { WeeklyDashboardImageGenerator } from '../../domain/interfaces/WeeklyDashboardImageGenerator';
import { StatsRepository } from '../../domain/interfaces/StatsRepository';

type Counts = { completed: number; inProgress: number; notStarted: number };

const normalize = (s: string) => String(s ?? '').trim().toLowerCase();

const isCompleted = (s: string) => {
    const v = normalize(s);
    return v === 'completed' || v === 'done' || v === 'finished' || v === 'hecha' || v === 'hechas' || v.includes('complete');
};

const isInProgress = (s: string) => {
    const v = normalize(s);
    return v === 'in_progress' || v === 'in progress' || v === 'progress' || v === 'en_curso' || v === 'en curso' || v.includes('progress');
};

const toCounts = (stats: any): Counts => {
    if (stats && Array.isArray(stats.sessions)) {
        const completed = stats.sessions.filter((x: any) => isCompleted(x.state)).length;
        const inProgress = stats.sessions.filter((x: any) => isInProgress(x.state)).length;
        const notStarted = Math.max(0, stats.sessions.length - completed - inProgress);
        return { completed, inProgress, notStarted };
    }

    const completed = Number(stats?.completed ?? 0) || 0;
    const inProgress = Number(stats?.inProgress ?? 0) || 0;
    const notStarted = Number(stats?.notStarted ?? 0) || 0;
    return { completed, inProgress, notStarted };
};

export class HtmlImageGenerator implements WeeklyDashboardImageGenerator {
    constructor(private readonly statsRepo?: StatsRepository) {}

    async generateWeeklyDashboardImage(input: { patientId: number }): Promise<{ buffer: Buffer; contentType: string }> {
        const raw = this.statsRepo ? await this.statsRepo.getWeeklyStats(input.patientId) : undefined;
        const counts = toCounts(raw);
        const buffer = await this.generateWeeklyDashboard(counts);
        return { buffer, contentType: 'image/png' };
    }

    async generateWeeklyDashboard(stats: any): Promise<Buffer> {
        const counts = toCounts(stats);

        const total = (counts.completed + counts.inProgress + counts.notStarted) || 1;
        const completedPct = Math.round((counts.completed / total) * 100);
        const inProgressPct = Math.round((counts.inProgress / total) * 100);
        const inProgressEnd = completedPct + inProgressPct;

        const isPerfect = completedPct === 100;
        const statusLabel = isPerfect ? '¡Objetivo Cumplido!' : 'Progreso de Adherencia';
        const progressColor = isPerfect ? '#f59e0b' : '#10b981';
        const labelColor = isPerfect ? '#f59e0b' : '#1a2a6c';

        const chromePath = '/usr/bin/google-chrome-stable';
        const executablePath =
            process.env.NODE_ENV === 'production' && fs.existsSync(chromePath) ? chromePath : undefined;

        return (await nodeHtmlToImage({
            transparent: true,
            puppeteerArgs: {
                executablePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            },
            html: `
      <html>
        <head>
          <style>
            body { width: 500px; height: 400px; font-family: sans-serif; background: #ffffff; display: flex; justify-content: center; align-items: center; margin: 0; }
            .chart-container { text-align: center; padding: 20px; }
            .donut-chart {
              width: 180px; height: 180px; border-radius: 50%;
              background: conic-gradient(${progressColor} 0% ${completedPct}%, #f59e0b ${completedPct}% ${inProgressEnd}%, #e2e8f0 ${inProgressEnd}% 100%);
              display: flex; align-items: center; justify-content: center; margin: 0 auto 30px auto;
            }
            .donut-inner { width: 135px; height: 135px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .pct-main-text { font-size: 52px; font-weight: bold; color: ${labelColor}; }
            .status-badge { font-size: 34px; font-weight: 800; color: ${labelColor}; }
          </style>
        </head>
        <body>
          <div class="chart-container">
            <div class="donut-chart"><div class="donut-inner"><span class="pct-main-text">${completedPct}%</span></div></div>
            <span class="status-badge">${statusLabel}</span>
          </div>
        </body>
      </html>`,
        })) as Buffer;
    }
}