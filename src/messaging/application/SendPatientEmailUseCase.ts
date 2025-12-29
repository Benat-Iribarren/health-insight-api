import { EmailRepository } from '../domain/EmailRepository';
import { DBClientService } from '../../common/storage/domain/DBClientService';

export interface SendEmailCommand {
    patientId: number;
    subject: string;
    body: string;
}

export class SendPatientEmailUseCase {
    constructor(
        private readonly emailRepository: EmailRepository,
        private readonly dbClient: DBClientService
    ) {}

    async execute(command: SendEmailCommand): Promise<void> {
        const { data: patient, error } = await this.dbClient
            .from('Patient')
            .select('email')
            .eq('id', command.patientId)
            .single();

        if (error || !patient?.email) {
            throw new Error('PATIENT_NOT_FOUND');
        }

        await this.emailRepository.send(patient.email, command.subject, command.body);
    }
}