import { StatsRepository } from '../../domain/interfaces/StatsRepository';
import { PatientContactRepository } from '../../domain/interfaces/PatientContactRepository';
import { WeeklyDashboardImageGenerator } from '../../domain/interfaces/WeeklyDashboardImageGenerator';
import { MailTemplateProvider } from '../../domain/interfaces/MailTemplateProvider';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { SendWeeklyStatsError, invalidInputError, noEmailError, operationFailedError } from '../types/SendWeeklyStatsError';
import { buildWeeklyInlineImageCid, deriveWeeklySummary, isValidOptionalPatientId } from '../../domain/logic/weeklyStatsEmail';

export type WeeklySendResult = {
    sent: number;
    skippedNoEmail: number;
};

export class SendWeeklyStatsService {
    constructor(
        private readonly statsRepository: StatsRepository,
        private readonly contactRepository: PatientContactRepository,
        private readonly imageGenerator: WeeklyDashboardImageGenerator,
        private readonly templateProvider: MailTemplateProvider,
        private readonly mailRepository: MailRepository
    ) {}

    async execute(input: { patientId?: number }): Promise<WeeklySendResult | SendWeeklyStatsError> {
        try {
            if (!isValidOptionalPatientId(input.patientId)) return invalidInputError;

            const imageCid = buildWeeklyInlineImageCid();

            if (input.patientId !== undefined) {
                const contact = await this.contactRepository.getPatientContact(input.patientId);
                if (!contact.email) return noEmailError;

                const stats = await this.statsRepository.getWeeklyStats(input.patientId);
                const summary = deriveWeeklySummary(stats);
                const image = await this.imageGenerator.generateWeeklyDashboardImage({ patientId: input.patientId });

                const rendered = this.templateProvider.renderWeeklyStats({
                    ...summary,
                    name: contact.name ?? summary.name,
                });

                await this.mailRepository.sendMail({
                    to: contact.email,
                    subject: 'Resumen semanal',
                    html: rendered,
                    inlineAttachments: [
                        {
                            filename: 'stats.png',
                            contentType: image.contentType,
                            contentId: imageCid,
                            content: image.buffer,
                        },
                    ],
                });

                return { sent: 1, skippedNoEmail: 0 };
            }

            const contacts = await this.contactRepository.getAllPatientsContacts();
            let sent = 0;
            let skippedNoEmail = 0;

            for (const c of contacts) {
                if (!c.email) {
                    skippedNoEmail += 1;
                    continue;
                }

                const stats = await this.statsRepository.getWeeklyStats(c.id);
                const summary = deriveWeeklySummary(stats);
                const image = await this.imageGenerator.generateWeeklyDashboardImage({ patientId: c.id });

                const rendered = this.templateProvider.renderWeeklyStats({
                    ...summary,
                    name: c.name ?? summary.name,
                });

                await this.mailRepository.sendMail({
                    to: c.email,
                    subject: 'Resumen semanal',
                    html: rendered,
                    inlineAttachments: [
                        {
                            filename: 'stats.png',
                            contentType: image.contentType,
                            contentId: imageCid,
                            content: image.buffer,
                        },
                    ],
                });

                sent += 1;
            }

            return { sent, skippedNoEmail };
        } catch {
            return operationFailedError;
        }
    }
}