import { SendWeeklyStatsService } from '../SendWeeklyStatsService';
import { StatsRepository, PatientStats } from '../../../domain/interfaces/StatsRepository';
import { MailRepository } from '../../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { MailTemplateProvider } from '../../../domain/interfaces/MailTemplateProvider';
import { WeeklyDashboardImageGenerator } from '../../../domain/interfaces/WeeklyDashboardImageGenerator';

describe('Unit | SendWeeklyStatsService', () => {
    const statsRepo = { getAllPatientsStats: jest.fn() } as unknown as jest.Mocked<StatsRepository>;
    const mailRepo = { send: jest.fn() } as unknown as jest.Mocked<MailRepository>;
    const notifyRepo = { getPendingCount: jest.fn() } as unknown as jest.Mocked<NotificationRepository>;
    const contactRepo = { getEmailByPatientId: jest.fn() } as unknown as jest.Mocked<PatientContactRepository>;
    const template = { renderWeeklyStats: jest.fn() } as unknown as jest.Mocked<MailTemplateProvider>;
    const image = { generateWeeklyDashboard: jest.fn() } as unknown as jest.Mocked<WeeklyDashboardImageGenerator>;

    const fullPatient: PatientStats = {
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        sessions: [],
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        nextWeekSessions: 0
    };

    it('returns NO_DATA when filtered patient list is empty', async () => {
        statsRepo.getAllPatientsStats.mockResolvedValue([fullPatient]);
        const result = await SendWeeklyStatsService(statsRepo, mailRepo, notifyRepo, contactRepo, template, image, 999);
        expect(result.status).toBe('NO_DATA');
    });

    it('stops processing and returns SUCCESSFUL with current count if a mail send fails', async () => {
        statsRepo.getAllPatientsStats.mockResolvedValue([fullPatient]);
        notifyRepo.getPendingCount.mockResolvedValue(0);
        image.generateWeeklyDashboard.mockResolvedValue(Buffer.from(''));
        template.renderWeeklyStats.mockReturnValue('html');
        mailRepo.send.mockResolvedValue({ success: false });

        const result = await SendWeeklyStatsService(statsRepo, mailRepo, notifyRepo, contactRepo, template, image);
        expect(result.processedCount).toBe(0);
        expect(result.status).toBe('SUCCESSFUL');
    });

    it('skips patients without email (undefined) and continues', async () => {
        const p1 = { ...fullPatient, id: 1, email: undefined };
        const p2 = { ...fullPatient, id: 2, email: 'p2@test.com' };

        statsRepo.getAllPatientsStats.mockResolvedValue([p1, p2]);
        contactRepo.getEmailByPatientId.mockResolvedValue(null);
        notifyRepo.getPendingCount.mockResolvedValue(0);
        image.generateWeeklyDashboard.mockResolvedValue(Buffer.from(''));
        template.renderWeeklyStats.mockReturnValue('h');
        mailRepo.send.mockResolvedValue({ success: true });

        const result = await SendWeeklyStatsService(statsRepo, mailRepo, notifyRepo, contactRepo, template, image);
        expect(result.processedCount).toBe(1);
    });
});