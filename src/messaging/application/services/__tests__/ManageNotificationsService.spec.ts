import { GetPatientInboxService, ReadNotificationService, DeleteNotificationService } from '../ManageNotificationsService';
import { NotificationRepository, Notification } from '../../../domain/interfaces/NotificationRepository';

describe('Unit | ManageNotificationsService', () => {
    const mockRepo: jest.Mocked<NotificationRepository> = {
        getPatientNotifications: jest.fn(),
        getNotificationDetail: jest.fn(),
        markAsRead: jest.fn(),
        deleteNotification: jest.fn(),
        saveNotification: jest.fn(),
        getPendingCount: jest.fn()
    };

    describe('GetPatientInboxService', () => {
        it('returns notifications list on success', async () => {
            mockRepo.getPatientNotifications.mockResolvedValue([]);
            const result = await GetPatientInboxService(mockRepo, 1);
            expect(Array.isArray(result)).toBe(true);
        });

        it('returns OPERATION_FAILED when repository throws', async () => {
            mockRepo.getPatientNotifications.mockRejectedValue(new Error());
            const result = await GetPatientInboxService(mockRepo, 1);
            expect(result).toBe('OPERATION_FAILED');
        });
    });

    describe('ReadNotificationService', () => {
        it('returns NOT_FOUND if notification does not exist', async () => {
            mockRepo.getNotificationDetail.mockResolvedValue(null);
            const result = await ReadNotificationService(mockRepo, 1, 'uuid');
            expect(result).toBe('NOT_FOUND');
        });

        it('returns OPERATION_FAILED when markAsRead fails', async () => {
            mockRepo.getNotificationDetail.mockResolvedValue({ is_read: false } as Notification);
            mockRepo.markAsRead.mockRejectedValue(new Error());
            const result = await ReadNotificationService(mockRepo, 1, 'uuid');
            expect(result).toBe('OPERATION_FAILED');
        });
    });

    describe('DeleteNotificationService', () => {
        it('returns NOT_FOUND when deleting non-existent notification', async () => {
            mockRepo.getNotificationDetail.mockResolvedValue(null);
            const result = await DeleteNotificationService(mockRepo, 1, 'uuid');
            expect(result).toBe('NOT_FOUND');
        });

        it('returns OPERATION_FAILED if deletion fails', async () => {
            mockRepo.getNotificationDetail.mockResolvedValue({ id: 'uuid' } as Notification);
            mockRepo.deleteNotification.mockRejectedValue(new Error());
            const result = await DeleteNotificationService(mockRepo, 1, 'uuid');
            expect(result).toBe('OPERATION_FAILED');
        });
    });
});