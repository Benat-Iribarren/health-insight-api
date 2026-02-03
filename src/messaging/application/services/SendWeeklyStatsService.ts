import { MailRepository } from '../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { StatsRepository, PatientStats } from '../../domain/interfaces/StatsRepository';
import { MailTemplateProvider } from '../../domain/interfaces/MailTemplateProvider';
import { PatientContactRepository } from '../../domain/interfaces/PatientContactRepository';
import { WeeklyDashboardImageGenerator } from '../../domain/interfaces/WeeklyDashboardImageGenerator';
import { SendWeeklyStatsError } from '../types/SendWeeklyStatsError';

export async function SendWeeklyStatsService(
    statsRepo: StatsRepository,
    mailRepo: MailRepository,
    notificationRepo: NotificationRepository,
    patientContactRepo: PatientContactRepository,
    templateProvider: MailTemplateProvider,
    imageGenerator: WeeklyDashboardImageGenerator,
    patientId?: number
): Promise<{ status: 'SUCCESSFUL' | SendWeeklyStatsError; processedCount: number }> {
    const patientsData = await statsRepo.getAllPatientsStats();
    let processedCount = 0;
    const filteredPatients =
        patientId !== undefined ? patientsData.filter((p: PatientStats) => p.id === patientId) : patientsData;

    if (filteredPatients.length === 0) return { status: 'NO_DATA', processedCount: 0 };

    for (const patient of filteredPatients) {
        const id = patient.id;
        if (!id) continue;

        const email = patient.email ?? (await patientContactRepo.getEmailByPatientId(id));
        if (!email) continue;

        const counters = calculateWeeklyCounters(patient);

        const pendingCount = await notificationRepo.getPendingCount(id);

        const imageBuffer = await imageGenerator.generateWeeklyDashboard({
            completed: counters.completed,
            inProgress: counters.inProgress,
            notStarted: counters.notStarted,
        });

        const htmlContent = templateProvider.renderWeeklyStats({
            completed: counters.completed,
            inProgress: counters.inProgress,
            pending: counters.notStarted,
            nextWeekSessions: counters.nextWeekSessions,
            name: patient.name || 'Paciente',
        });

        const sendResult = await mailRepo.send(email, 'Tu resumen semanal de salud', htmlContent, pendingCount, imageBuffer);

        if (!sendResult.success) return { status: 'SUCCESSFUL', processedCount };

        processedCount++;
    }

    return { status: 'SUCCESSFUL', processedCount };}

function calculateWeeklyCounters(patient: PatientStats): {
    completed: number;
    inProgress: number;
    notStarted: number;
    nextWeekSessions: number;
} {
    const now = new Date();
    const nextWeek = new Date(now.getTime());
    nextWeek.setDate(now.getDate() + 7);

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let nextWeekSessions = 0;

    const sessions = patient.sessions ?? [];
    for (const s of sessions) {
        const sessionDate = new Date(s.scheduled_at);

        if (sessionDate <= now) {
            if (s.state === 'completed') completed += 1;
            else if (s.state === 'in_progress') inProgress += 1;
            else notStarted += 1;
        } else if (sessionDate > now && sessionDate <= nextWeek) {
            nextWeekSessions += 1;
        }
    }

    return { completed, inProgress, notStarted, nextWeekSessions };
}
