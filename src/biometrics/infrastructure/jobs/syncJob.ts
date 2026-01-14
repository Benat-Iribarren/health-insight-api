import 'dotenv/config';
import { SyncDailyBiometrics } from '../../application/use-cases/SyncDailyBiometrics';

async function run() {
    const useCase = new SyncDailyBiometrics();
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    try {
        await useCase.execute(dateStr);
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}

run();