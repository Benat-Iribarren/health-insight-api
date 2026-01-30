export type RemoteFile = { key: string };

export interface BiometricsFileSource {
    listDailyFiles(date: string): Promise<RemoteFile[]>;
    getFileText(key: string): Promise<string | null>;
}
