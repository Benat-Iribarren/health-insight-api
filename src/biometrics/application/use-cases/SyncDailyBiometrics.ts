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

        const dailyFiles = allContents.filter(obj => obj.Key && obj.Key.endsWith('.csv'));
        const unifiedData: Record<string, any> = {};

        for (const file of dailyFiles) {
            try {
                const response = await this.s3.send(new GetObjectCommand({ Bucket: this.BUCKET, Key: file.Key! }));
                if (!(response.Body instanceof Readable)) continue;

                const chunks: any[] = [];
                for await (const chunk of response.Body) chunks.push(chunk);
                const csvContent = Buffer.concat(chunks).toString();
                const fileName = file.Key!.split('/').pop() || "";
                const records: any[] = parse(csvContent, { columns: true, skip_empty_lines: true });

                for (const row of records) {
                    if (row.missing_value_reason) continue;

                    const ts = row.timestamp_iso || row.timestamp;
                    if (!unifiedData[ts]) {
                        unifiedData[ts] = {
                            timestamp_iso: ts,
                            timestamp_unix_ms: new Date(ts).getTime(),
                            pulse_rate_bpm: null,
                            eda_scl_usiemens: null,
                            temperature_celsius: null,
                            accel_std_g: null,
                            body_position_type: null,
                            respiratory_rate_brpm: null
                        };
                    }

                    if (fileName.includes('pulse-rate'))
                        unifiedData[ts].pulse_rate_bpm = parseFloat(row.pulse_rate_bpm);

                    if (fileName.includes('eda'))
                        unifiedData[ts].eda_scl_usiemens = parseFloat(row.eda_scl_usiemens);

                    if (fileName.includes('temperature'))
                        unifiedData[ts].temperature_celsius = parseFloat(row.temperature_celsius);

                    if (fileName.includes('respiratory-rate'))
                        unifiedData[ts].respiratory_rate_brpm = parseFloat(row.respiratory_rate_brpm);

                    if (fileName.includes('accelerometers-std'))
                        unifiedData[ts].accel_std_g = parseFloat(row.accelerometers_std_g);

                    if (fileName.includes('body-position'))
                        unifiedData[ts].body_position_type = row.body_position_left || row.body_position_right;
                }
            } catch (e) { continue; }
        }

        const rowsToInsert = Object.values(unifiedData);

        if (rowsToInsert.length > 0) {
            await this.repository.upsertBiometricMinutes(rowsToInsert);
        }

        return {
            status: "success",
            dateProcessed: date,
            summary: { filesFound: dailyFiles.length, rowsInserted: rowsToInsert.length }
        };
    }
}