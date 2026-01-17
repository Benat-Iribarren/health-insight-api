import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { parse } from 'csv-parse/sync';
import { Readable } from 'stream';
import { SupabaseBiometricsRepository } from '../../infrastructure/database/SupabaseBiometricsRepository';

export class SyncDailyBiometrics {
    private s3 = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.EMPATICA_AWS_ACCESS_KEY!,
            secretAccessKey: process.env.EMPATICA_AWS_SECRET_KEY!
        }
    });
    private BUCKET = "empatica-us-east-1-prod-data";
    private PREFIX = "v2/451/1/1/participant_data/";

    constructor(private readonly repository: SupabaseBiometricsRepository) {}

    async execute(date: string): Promise<any> {
        let allContents: any[] = [];
        let continuationToken: string | undefined = undefined;

        do {
            const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
                Bucket: this.BUCKET,
                Prefix: `${this.PREFIX}${date}/`,
                ContinuationToken: continuationToken
            });
            const response = await this.s3.send(listCommand);
            if (response.Contents) allContents = allContents.concat(response.Contents);
            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        const dailyFiles = allContents.filter(obj =>
            obj.Key && obj.Key.endsWith('.csv') && obj.Key.includes('aggregated_per_minute')
        );

        if (dailyFiles.length === 0) return { filesFound: 0, rowsInserted: 0 };

        const unifiedData: Record<string, any> = {};

        for (const file of dailyFiles) {
            try {
                const response = await this.s3.send(new GetObjectCommand({ Bucket: this.BUCKET, Key: file.Key! }));
                if (!(response.Body instanceof Readable)) continue;

                const chunks: any[] = [];
                for await (const chunk of response.Body) chunks.push(chunk);
                const csvContent = Buffer.concat(chunks).toString();

                const fileName = file.Key!.split('/').pop() || "";
                const metricType = fileName.split('_').pop()?.replace('.csv', '');
                const participantId = fileName.split(`_${date}_`)[0];

                const records = parse(csvContent, { columns: true, skip_empty_lines: true });

                for (const row of (records as any[])) {
                    if (row.missing_value_reason === 'device_not_recording') continue;

                    const ts = row.timestamp_iso || row.timestamp;
                    const key = `${participantId}_${ts}`;

                    if (!unifiedData[key]) {
                        unifiedData[key] = {
                            participant_full_id: participantId,
                            timestamp_iso: ts,
                            timestamp_unix_ms: new Date(ts).getTime(),
                            pulse_rate_bpm: null,
                            eda_scl_usiemens: null,
                            temperature_celsius: null,
                            prv_rmssd_ms: null,
                            respiratory_rate_brpm: null,
                            created_at: new Date().toISOString()
                        };
                    }

                    const val = parseFloat(row.value || row.pulse_rate_bpm || row.eda_scl_usiemens || row.temperature_celsius || 0);

                    switch (metricType) {
                        case 'pulse-rate':
                            unifiedData[key].pulse_rate_bpm = val;
                            break;
                        case 'eda':
                            unifiedData[key].eda_scl_usiemens = val;
                            break;
                        case 'temperature':
                            unifiedData[key].temperature_celsius = val;
                            break;
                        case 'prv':
                            unifiedData[key].prv_rmssd_ms = val;
                            break;
                        case 'respiratory-rate':
                            unifiedData[key].respiratory_rate_brpm = val;
                            break;
                        case 'spo2':
                            unifiedData[key].spo2_percentage = val;
                            break;
                    }
                }
            } catch (e) { continue; }
        }

        const rowsToInsert = Object.values(unifiedData).filter(r =>
            r.pulse_rate_bpm !== null || r.eda_scl_usiemens !== null || r.temperature_celsius !== null
        );

        if (rowsToInsert.length > 0) {
            await this.repository.upsertBiometricMinutes(rowsToInsert);
        }

        return { filesFound: dailyFiles.length, rowsInserted: rowsToInsert.length };
    }
}