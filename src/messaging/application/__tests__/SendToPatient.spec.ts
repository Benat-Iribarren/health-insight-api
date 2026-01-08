import { SendToPatient } from '../SendToPatient';
import { MESSAGING_RESPONSES } from '../../domain/MessagingError';

describe('SendToPatient Service', () => {
    const mockPatientRepo = { getEmailByPatientId: jest.fn() };
    const mockMailRepo = { send: jest.fn() };

    const service = new SendToPatient(mockPatientRepo as any, mockMailRepo as any);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return SUCCESSFUL when patient email exists and mail is sent', async () => {
        mockPatientRepo.getEmailByPatientId.mockResolvedValue('test@patient.com');
        mockMailRepo.send.mockResolvedValue({ success: true });

        const result = await service.execute({
            patientId: 1,
            subject: 'Test',
            body: 'Body'
        });

        expect(result).toBe('SUCCESSFUL');
        expect(mockMailRepo.send).toHaveBeenCalledWith('test@patient.com', 'Test', 'Body');
    });

    it('should return error code when patient email is not found', async () => {
        mockPatientRepo.getEmailByPatientId.mockResolvedValue(null);

        const result = await service.execute({
            patientId: 99,
            subject: 'Test',
            body: 'Body'
        });

        expect(result).toBe(MESSAGING_RESPONSES.ERRORS.PATIENT_EMAIL_NOT_FOUND.code);
        expect(mockMailRepo.send).not.toHaveBeenCalled();
    });
});