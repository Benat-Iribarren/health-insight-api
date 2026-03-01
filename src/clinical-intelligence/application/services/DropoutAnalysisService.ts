import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { DropoutRisk } from '../../domain/models/DropoutRisk';
import { calculateDropoutRisks } from '../../domain/logic/calculateDropoutRisks';
import { analysisFailedError, noDataError, PredictDropoutError } from '../types/PredictDropoutError';

export class DropoutAnalysisService {
    constructor(private readonly repository: DropoutRepository) {}

    async execute(patientId?: number): Promise<DropoutRisk[] | PredictDropoutError> {
        try {
            const data = await this.repository.getPatientSessionData(patientId);
            if (!data || data.length === 0) return noDataError;
            return calculateDropoutRisks(data);
        } catch {
            return analysisFailedError;
        }
    }
}