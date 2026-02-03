import { sendToPatientService } from '../SendToPatientService';

describe('Unit | SendToPatientService', () => {
    const mailRepo = { send: jest.fn().mockResolvedValue({ success: true }) };
    const notificationRepo = { saveNotification: jest.fn().mockResolvedValue(undefined) };
    const contactRepo = { getEmailByPatientId: jest.fn().mockResolvedValue('patient@test.com') };
    const templateProvider = { render: jest.fn().mockReturnValue('<html></html>') };

    const service = new sendToPatientService(
        mailRepo as any,
        notificationRepo as any,
        contactRepo as any,
        templateProvider as any
    );

    it('coordinates the complete flow for sending a message', async () => {
        const params = {
            patientId: 1,
            subject: 'Test Subject',
            body: 'Test Body'
        };

        await service.execute(params);

        expect(contactRepo.getEmailByPatientId).toHaveBeenCalledWith(1);
        expect(templateProvider.render).toHaveBeenCalledWith('professional-message', expect.any(Object));
        expect(mailRepo.send).toHaveBeenCalledWith('patient@test.com', 'Test Subject', '<html></html>');
        expect(notificationRepo.saveNotification).toHaveBeenCalledWith(1, 'Test Subject', 'Test Body');
    });

    it('throws error when patient contact is missing', async () => {
        contactRepo.getEmailByPatientId.mockResolvedValueOnce(null);

        await expect(service.execute({
            patientId: 99,
            subject: 'Error',
            body: 'Error'
        })).rejects.toThrow();
    });
});