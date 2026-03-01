import { BiometricSample } from '../../../domain/models/BiometricSample';

export function mapBiometricSampleInsert(m: BiometricSample) {
    return {
        timestamp_iso: m.timestamp.toISOString(),
        pulse_rate_bpm: m.pulseRateBpm,
        eda_scl_usiemens: m.edaSclUsiemens,
        temperature_celsius: m.temperatureCelsius,
        accel_std_g: m.accelStdG,
        body_position_type: m.bodyPositionType,
        respiratory_rate_brpm: m.respiratoryRateBrpm,
    };
}