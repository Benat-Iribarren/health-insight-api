import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { parse } from 'csv-parse/sync';

export class SyncDailyBiometrics {
    private s3 = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.EMPATICA_AWS_ACCESS_KEY!,
            secretAccessKey: process.env.EMPATICA_AWS_SECRET_KEY!
        }
    });
    private BUCKET = "empatica-us-east-1-prod-data";
    private PREFIX = "v2/451/";

    async execute(date: string): Promise<any> {
        const listCommand = new ListObjectsV2Command({
            Bucket: this.BUCKET,
            Prefix: this.PREFIX
        });

        const { Contents } = await this.s3.send(listCommand);
        if (!Contents) return { filesProcessed: 0, message: "No se encontraron archivos en el bucket" };

        // Filtramos archivos por fecha, igual que id_serial + '_' + date en tu script
        const dailyFiles = Contents.filter(obj => obj.Key && obj.Key.includes(`_${date}_`));
        let totalInserted = 0;

        for (const file of dailyFiles) {
            try {
                const response = await this.s3.send(new GetObjectCommand({ Bucket: this.BUCKET, Key: file.Key! }));
                const csv = await response.Body?.transformToString();
                if (!csv) continue;

                const fileName = file.Key!.split('/').pop() || "";
                const parts = fileName.split('_');
                const participantId = parts[0];
                const metricType = parts[parts.length - 1].replace('.csv', '');

                const records = parse(csv, { columns: true, skip_empty_lines: true });

                // Mapeo dinámico basado en tu script visualiza.py
                const rows = records
                    .filter((r: any) => r.missing_value_reason !== 'device_not_recording')
                    .map((r: any) => {
                        const ts = r.timestamp_iso || r.timestamp;
                        return {
                            participant_full_id: participantId,
                            timestamp_iso: ts,
                            timestamp_unix_ms: new Date(ts).getTime(),
                            pulse_rate_bpm: metricType === 'pulse-rate' ? parseFloat(r.pulse_rate_bpm || r.value || r.rate || 0) : null,
                            eda_scl_usiemens: metricType === 'eda' ? parseFloat(r.eda_scl_usiemens || r.value || r.eda || 0) : null,
                            temperature_celsius: metricType === 'temperature' ? parseFloat(r.temperature_celsius || r.value || r.temp || 0) : null,
                            prv_rmssd_ms: metricType === 'prv' ? parseFloat(r.value || 0) : null,
                            respiratory_rate_brpm: metricType === 'respiratory-rate' ? parseFloat(r.value || 0) : null
                        };
                    });

                if (rows.length > 0) {
                    const { error } = await (supabaseClient as any).from('biometric_minutes').insert(rows);
                    if (error) throw error;
                    totalInserted += rows.length;
                }
            } catch (e) {
                continue; // Replica el 'continue' de tu script ante errores de descarga
            }
        }
        return { filesFound: dailyFiles.length, rowsInserted: totalInserted };
    }
}