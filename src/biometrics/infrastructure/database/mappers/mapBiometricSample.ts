import { BiometricSample } from '../../../domain/models/BiometricSample';

export function mapBiometricSample(r: any): BiometricSample {
    return {
        timestamp: new Date(r.timestamp_iso),
        pulseRateBpm: r.pulse_rate_bpm ?? null,
        edaSclUsiemens: r.eda_scl_usiemens ?? null,
        temperatureCelsius: r.temperature_celsius ?? null,
        accelStdG: r.accel_std_g ?? null,
        respiratoryRateBrpm: r.respiratory_rate_brpm ?? null,
        bodyPositionType: r.body_position_type ?? null,
    };
}