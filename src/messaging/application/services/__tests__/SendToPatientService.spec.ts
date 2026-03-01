import { SendToPatientService } from '../SendToPatientService';
import { invalidInputError, noEmailError, operationFailedError } from '../../types/SendToPatientError';

describe('Unit | SendToPatientService', () => {
    const makeNotificationRepo = () => ({
        create: jest.fn(),
        pendingCount: jest.fn(),
    });

    const makeContactRepo = () => ({
        getPatientContact: jest.fn(),
    });

    const makeMailRepo = () => ({
        sendMail: jest.fn(),
    });

    const makeTemplateProvider = () => ({
        renderMessageNotification: jest.fn().mockReturnValue('<p>rendered</p>'),
    });

    test('returns INVALID_INPUT for invalid input', async () => {
        const service = new SendToPatientService(makeNotificationRepo() as any, makeContactRepo() as any, makeMailRepo() as any, makeTemplateProvider() as any);

        const res = await service.execute({ patientId: 0, subject: '', content: '' });
        expect(res).toBe(invalidInputError);
    });

    test('returns NO_EMAIL when contact has no email', async () => {
        const notificationRepo = makeNotificationRepo();
        const contactRepo = makeContactRepo();
        const mailRepo = makeMailRepo();

        notificationRepo.create.mockResolvedValue(undefined);
        contactRepo.getPatientContact.mockResolvedValue({ id: 1, name: 'P', email: null });
        notificationRepo.pendingCount.mockResolvedValue(0);

        const service = new SendToPatientService(notificationRepo as any, contactRepo as any, mailRepo as any, makeTemplateProvider() as any);
        const res = await service.execute({ patientId: 1, subject: 'S', content: '<p>x</p>' });

        expect(res).toBe(noEmailError);
        expect(mailRepo.sendMail).not.toHaveBeenCalled();
    });

    test('returns SUCCESSFUL when sent', async () => {
        const notificationRepo = makeNotificationRepo();
        const contactRepo = makeContactRepo();
        const mailRepo = makeMailRepo();

        notificationRepo.create.mockResolvedValue(undefined);
        contactRepo.getPatientContact.mockResolvedValue({ id: 1, name: 'P', email: 'a@b.com' });
        mailRepo.sendMail.mockResolvedValue(undefined);
        notificationRepo.pendingCount.mockResolvedValue(2);
        const templateProvider = makeTemplateProvider();

        const service = new SendToPatientService(notificationRepo as any, contactRepo as any, mailRepo as any, templateProvider as any);
        const res = await service.execute({ patientId: 1, subject: 'S', content: '<p>x</p>' });

        expect(res).toBe('SUCCESSFUL');
        expect(mailRepo.sendMail).toHaveBeenCalledWith({ to: 'a@b.com', subject: 'S', html: '<p>rendered</p>' });
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const notificationRepo = makeNotificationRepo();
        const contactRepo = makeContactRepo();
        const mailRepo = makeMailRepo();

        notificationRepo.create.mockRejectedValue(new Error('boom'));

        const service = new SendToPatientService(notificationRepo as any, contactRepo as any, mailRepo as any, makeTemplateProvider() as any);
        const res = await service.execute({ patientId: 1, subject: 'S', content: 'x' });

        expect(res).toBe(operationFailedError);
    });
});