import { ProcessSendWeeklyStatsService } from '../ProcessSendWeeklyStatsService';
import { StatsRepository, PatientStats } from '../../domain/interfaces/StatsRepository';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { PatientContactRepository } from '../../domain/interfaces/PatientContactRepository';
import { MailTemplateProvider } from '../../domain/interfaces/MailTemplateProvider';
import { WeeklyDashboardImageGenerator } from '../../domain/interfaces/WeeklyDashboardImageGenerator';

describe('Unit | ProcessSendWeeklyStatsService', () => {
    const statsRepo: jest.Mocked<StatsRepository> = {
        getAllPatientsStats: jest.fn(),
        getWeeklyStats: jest.fn()
    };

    const mailRepo: jest.Mocked<MailRepository> = {
        send: jest.fn()
    };

    const notificationRepo: jest.Mocked<NotificationRepository> = {
        getPatientNotifications: jest.fn(),
        getNotificationDetail: jest.fn(),
        markAsRead: jest.fn(),
        deleteNotification: jest.fn(),
        saveNotification: jest.fn(),
        getPendingCount: jest.fn()
    };

    const patientContactRepo: jest.Mocked<PatientContactRepository> = {
        getEmailByPatientId: jest.fn()
    };

    const templateProvider: jest.Mocked<MailTemplateProvider> = {
        renderMessageNotification: jest.fn(),
        renderWeeklyStats: jest.fn()
    };

    const imageGenerator: jest.Mocked<WeeklyDashboardImageGenerator> = {
        generateWeeklyDashboard: jest.fn()
    };

    it('returns NO_DATA if no patients exist', async () => {
        statsRepo.getAllPatientsStats.mockResolvedValue([]);

        const result = await ProcessSendWeeklyStatsService(
            statsRepo,
            mailRepo,
            notificationRepo,
            patientContactRepo,
            templateProvider,
            imageGenerator
        );

        expect(result.status).toBe('NO_DATA');
        expect(result.processedCount).toBe(0);
    });

    it('processes and increments processedCount for successful mail sends', async () => {
        const patientsData: PatientStats[] = [{
            id: 1,
            email: 'patient@test.com',
            name: 'Test Patient',
            sessions: [
                { state: 'completed', scheduled_at: new Date().toISOString() }
            ],
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            nextWeekSessions: 0
        }];

        statsRepo.getAllPatientsStats.mockResolvedValue(patientsData);
        notificationRepo.getPendingCount.mockResolvedValue(2);
        imageGenerator.generateWeeklyDashboard.mockResolvedValue(Buffer.from('image-data'));
        templateProvider.renderWeeklyStats.mockReturnValue('<html></html>');
        mailRepo.send.mockResolvedValue({ success: true });

        const result = await ProcessSendWeeklyStatsService(
            statsRepo,
            mailRepo,
            notificationRepo,
            patientContactRepo,
            templateProvider,
            imageGenerator
        );

        expect(result.status).toBe('SUCCESSFUL');
        expect(result.processedCount).toBe(1);
        expect(mailRepo.send).toHaveBeenCalledWith(
            'patient@test.com',
            'Tu resumen semanal de salud',
            '<html></html>',
            2,
            expect.any(Buffer)
        );
    });

    it('filters by patientId when provided', async () => {
        const patientsData: PatientStats[] = [
            { id: 1, email: 'p1@test.com', name: 'P1', sessions: [], completed: 0, inProgress: 0, notStarted: 0, nextWeekSessions: 0 },
            { id: 2, email: 'p2@test.com', name: 'P2', sessions: [], completed: 0, inProgress: 0, notStarted: 0, nextWeekSessions: 0 }
        ];

        statsRepo.getAllPatientsStats.mockResolvedValue(patientsData);
        notificationRepo.getPendingCount.mockResolvedValue(0);
        imageGenerator.generateWeeklyDashboard.mockResolvedValue(Buffer.from(''));
        templateProvider.renderWeeklyStats.mockReturnValue('html');
        mailRepo.send.mockResolvedValue({ success: true });

        const result = await ProcessSendWeeklyStatsService(
            statsRepo,
            mailRepo,
            notificationRepo,
            patientContactRepo,
            templateProvider,
            imageGenerator,
            2
        );

        expect(result.processedCount).toBe(1);
        expect(mailRepo.send).toHaveBeenCalledTimes(1);
        expect(mailRepo.send).toHaveBeenCalledWith('p2@test.com', expect.any(String), expect.any(String), expect.any(Number), expect.any(Buffer));
    });
});