import { SendWeeklyStatsService } from '../SendWeeklyStatsService';
import { invalidInputError, noEmailError, operationFailedError } from '../../types/SendWeeklyStatsError';

describe('Unit | SendWeeklyStatsService', () => {
    const makeStatsRepo = () => ({
        getWeeklyStats: jest.fn(),
    });

    const makeContactRepo = () => ({
        getPatientContact: jest.fn(),
        getAllPatientsContacts: jest.fn(),
    });

    const makeImage = () => ({
        generateWeeklyDashboardImage: jest.fn(),
    });

    const makeTemplate = () => ({
        renderWeeklyStats: jest.fn(),
    });

    const makeMail = () => ({
        sendMail: jest.fn(),
    });

    test('returns INVALID_INPUT when patientId invalid', async () => {
        const service = new SendWeeklyStatsService(
            makeStatsRepo() as any,
            makeContactRepo() as any,
            makeImage() as any,
            makeTemplate() as any,
            makeMail() as any
        );

        const res = await service.execute({ patientId: -1 });
        expect(res).toBe(invalidInputError);
    });

    test('single patient returns NO_EMAIL when missing email', async () => {
        const statsRepo = makeStatsRepo();
        const contactRepo = makeContactRepo();
        const image = makeImage();
        const template = makeTemplate();
        const mail = makeMail();

        contactRepo.getPatientContact.mockResolvedValue({ id: 1, name: 'P', email: null });

        const service = new SendWeeklyStatsService(statsRepo as any, contactRepo as any, image as any, template as any, mail as any);
        const res = await service.execute({ patientId: 1 });

        expect(res).toBe(noEmailError);
    });

    test('bulk skips no-email and sends the rest', async () => {
        const statsRepo = makeStatsRepo();
        const contactRepo = makeContactRepo();
        const image = makeImage();
        const template = makeTemplate();
        const mail = makeMail();

        contactRepo.getAllPatientsContacts.mockResolvedValue([
            { id: 1, name: 'A', email: null },
            { id: 2, name: 'B', email: 'b@test.com' },
        ]);

        statsRepo.getWeeklyStats.mockResolvedValue({
            patientId: 2,
            email: 'b@test.com',
            name: 'B',
            sessions: [{ state: 'completed', assignedDate: new Date().toISOString() }],
        });

        image.generateWeeklyDashboardImage.mockResolvedValue({ contentType: 'image/png', buffer: Buffer.from('x') });
        template.renderWeeklyStats.mockReturnValue('<html>ok</html>');
        mail.sendMail.mockResolvedValue(undefined);

        const service = new SendWeeklyStatsService(statsRepo as any, contactRepo as any, image as any, template as any, mail as any);
        const res = await service.execute({});

        expect(res).toEqual({ sent: 1, skippedNoEmail: 1 });
        expect(mail.sendMail).toHaveBeenCalledTimes(1);
        expect(mail.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'b@test.com',
                subject: 'Resumen semanal',
                html: '<html>ok</html>',
                inlineAttachments: [
                    expect.objectContaining({
                        contentType: 'image/png',
                        contentId: 'stats',
                    }),
                ],
            })
        );
    });

    test('returns OPERATION_FAILED on exception', async () => {
        const statsRepo = makeStatsRepo();
        const contactRepo = makeContactRepo();
        const image = makeImage();
        const template = makeTemplate();
        const mail = makeMail();

        contactRepo.getAllPatientsContacts.mockRejectedValue(new Error('boom'));

        const service = new SendWeeklyStatsService(statsRepo as any, contactRepo as any, image as any, template as any, mail as any);
        const res = await service.execute({});

        expect(res).toBe(operationFailedError);
    });
});