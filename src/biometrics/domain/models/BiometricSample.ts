export interface BiometricSample {
    timestamp: Date;
    pulseRateBpm: number | null;
    edaSclUsiemens: number | null;
    temperatureCelsius: number | null;
    accelStdG: number | null;
    respiratoryRateBrpm: number | null;
    bodyPositionType: string | null;
}