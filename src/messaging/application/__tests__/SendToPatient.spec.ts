import { SendToPatient } from '../SendToPatient';

describe('SendToPatient Service', () => {
    const mockPatientRepo = { getEmailByPatientId: jest.fn() };
    const mockMailRepo = { send: jest.fn() };
    const mockNotificationRepo = {
        saveNotification: jest.fn(),
        getPendingCount: jest.fn()
    };

    const service = new SendToPatient(
        mockPatientRepo as any,
        mockMailRepo as any,
        mockNotificationRepo as any
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true when patient email exists and mail is sent', async () => {
        mockPatientRepo.getEmailByPatientId.mockResolvedValue('test@patient.com');
        mockNotificationRepo.getPendingCount.mockResolvedValue(1);
        mockMailRepo.send.mockResolvedValue({ success: true });

        const result = await service.execute({
            patientId: 1,
            subject: 'Test',
            body: 'Body'
        });

        expect(result).toBe(true);
        expect(mockNotificationRepo.saveNotification).toHaveBeenCalledWith(1, 'Test', 'Body');
        expect(mockMailRepo.send).toHaveBeenCalledWith('test@patient.com', 'Test', 'Body', 1);
    });

    it('should return false when patient email is not found', async () => {
        mockPatientRepo.getEmailByPatientId.mockResolvedValue(null);

        const result = await service.execute({
            patientId: 99,
            subject: 'Test',
            body: 'Body'
        });

        expect(result).toBe(false);
        expect(mockNotificationRepo.saveNotification).not.toHaveBeenCalled();
        expect(mockMailRepo.send).not.toHaveBeenCalled();
    });
});