import {
    S3Client,
    ListObjectsV2Command,
    ListObjectsV2CommandOutput,
    GetObjectCommand,
    GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { BiometricsFileSource, RemoteFile } from '../../domain/interfaces/BiometricsFileSource';

export type EmpaticaS3Config = {
    region: string;
    bucket: string;
    prefix: string;
    accessKeyId: string;
    secretAccessKey: string;
};

function isReadableStream(body: unknown): body is Readable {
    return body instanceof Readable;
}

export class EmpaticaS3FileSource implements BiometricsFileSource {
    private readonly client: S3Client;
    private readonly config: EmpaticaS3Config;

    constructor(config: EmpaticaS3Config) {
        this.config = config;
        this.client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }

    async listDailyFiles(date: string): Promise<RemoteFile[]> {
        let all: RemoteFile[] = [];
        let token: string | undefined;

        do {
            const res: ListObjectsV2CommandOutput = await this.client.send(
                new ListObjectsV2Command({
                    Bucket: this.config.bucket,
                    Prefix: `${this.config.prefix}${date}/`,
                    ContinuationToken: token,
                })
            );

            const contents = res.Contents ?? [];

            const mapped: RemoteFile[] = contents
                .filter((obj): obj is { Key: string } => typeof obj.Key === 'string' && obj.Key.length > 0)
                .map((obj) => ({ key: obj.Key }));

            all = all.concat(mapped);
            token = res.NextContinuationToken;
        } while (token);

        return all;
    }

    async getFileText(key: string): Promise<string | null> {
        const res: GetObjectCommandOutput = await this.client.send(
            new GetObjectCommand({ Bucket: this.config.bucket, Key: key })
        );

        const body = res.Body;
        if (!isReadableStream(body)) return null;

        const chunks: Buffer[] = [];
        for await (const chunk of body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        return Buffer.concat(chunks).toString('utf8');
    }
}
