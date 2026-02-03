import { SendToPatientService } from '../SendToPatientService';
import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { MailTemplateProvider } from '../../../domain/interfaces/MailTemplateProvider';

describe('Unit | SendToPatientService', () => {
    const contactRepo = { getEmailByPatientId: jest.fn() } as unknown as jest.Mocked<PatientContactRepository>;
    const mailRepo = { send: jest.fn() } as unknown as jest.Mocked<MailRepository>;
    const notifyRepo = { saveNotification: jest.fn(), getPendingCount: jest.fn() } as unknown as jest.Mocked<NotificationRepository>;
    const template = { renderMessageNotification: jest.fn() } as unknown as jest.Mocked<MailTemplateProvider>;

    it('returns PATIENT_NOT_FOUND if contact email is missing', async () => {
        contactRepo.getEmailByPatientId.mockResolvedValue(null);
        const result = await SendToPatientService(contactRepo, mailRepo, notifyRepo, template, 1, 'S', 'B');
        expect(result).toBe('PATIENT_NOT_FOUND');
    });

    it('returns SEND_FAILED when saveNotification throws', async () => {
        contactRepo.getEmailByPatientId.mockResolvedValue('test@test.com');
        notifyRepo.saveNotification.mockRejectedValue(new Error('DB Error'));
        const result = await SendToPatientService(contactRepo, mailRepo, notifyRepo, template, 1, 'S', 'B');
        expect(result).toBe('SEND_FAILED');
    });

    it('returns SEND_FAILED when mail service fails', async () => {
        contactRepo.getEmailByPatientId.mockResolvedValue('test@test.com');
        notifyRepo.getPendingCount.mockResolvedValue(1);
        template.renderMessageNotification.mockReturnValue('html');
        mailRepo.send.mockResolvedValue({ success: false });

        const result = await SendToPatientService(contactRepo, mailRepo, notifyRepo, template, 1, 'S', 'B');
        expect(result).toBe('SEND_FAILED');
    });
});