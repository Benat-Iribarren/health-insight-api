import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
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

    async execute(date: string): Promise<void> {
        const { data: patients } = await (supabaseClient as any).from('Patient').select('id, device_serial');
        if (!patients) return;

        for (const patient of patients) {
            if (!patient.device_serial) continue;

            const minuteMap = new Map<string, any>();
            const metrics = [
                { file: 'pulse-rate', col: 'pulse_rate_bpm' },
                { file: 'prv', col: 'prv_rmssd_ms' },
                { file: 'respiratory-rate', col: 'respiratory_rate_brpm' },
                { file: 'eda', col: 'eda_scl_usiemens' },
                { file: 'temperature', col: 'temperature_celsius' }
            ];

            for (const m of metrics) {
                try {
                    const key = `v2/451/${patient.device_serial}_${date}_${m.file}.csv`;
                    const response = await this.s3.send(new GetObjectCommand({ Bucket: this.BUCKET, Key: key }));
                    const csv = await response.Body?.transformToString();

                    if (csv) {
                        const records = parse(csv, { columns: true, skip_empty_lines: true });
                        for (const r of records as any[]) {
                            const ts = r.timestamp_iso || r.timestamp;
                            if (!minuteMap.has(ts)) {
                                minuteMap.set(ts, {
                                    participant_full_id: patient.id,
                                    patient_id: patient.id,
                                    device_sn: patient.device_serial,
                                    timestamp_iso: ts,
                                    timestamp_unix_ms: new Date(ts).getTime()
                                });
                            }
                            minuteMap.get(ts)[m.col] = parseFloat(r.value || r.rate || r.eda || r.temperature || 0);
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            if (minuteMap.size > 0) {
                await (supabaseClient as any).from('biometric_minutes').insert(Array.from(minuteMap.values()));
            }
        }
    }
}