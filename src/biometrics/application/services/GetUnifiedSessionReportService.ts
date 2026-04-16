import { SessionMetricsRepository } from '../../domain/interfaces/SessionMetricsRepository';
import { Session } from '../../domain/models/Session';
import { ContextInterval } from '../../domain/models/ContextInterval';
import { BiometricSample } from '../../domain/models/BiometricSample';
import { UnifiedSessionReport } from '../../domain/models/UnifiedSessionReport';
import { BiometricsError, noDataFoundError, unknownError } from '../types/BiometricsError';
import { getGlobalRange } from '../../domain/logic/getGlobalRange';
import { selectSessionIntervals } from '../../domain/logic/selectSessionIntervals';
import { calculateMetrics } from '../../domain/logic/calculateMetrics';
import { calculateDizziness } from '../../domain/logic/calculateDizziness';

export class GetUnifiedSessionReportService {
    constructor(private readonly repository: SessionMetricsRepository) {}

    async execute(
        patientId: number,
        sessionId?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ data: UnifiedSessionReport[] | UnifiedSessionReport; meta: any } | BiometricsError> {
        try {
            const parsedSessionId = sessionId ? Number(sessionId) : undefined;
            const offset = (page - 1) * limit;

            const { sessions, intervals, total } = await this.repository.getFullSessionContext(
                patientId,
                parsedSessionId,
                limit,
                offset
            );

            if (!sessions.length) return noDataFoundError;

            const meta = { total: Number(total) || sessions.length, page, limit };

            if (!intervals.length) {
                const empty = sessions.map((s) => this.mapEmptyUnifiedSessionReport(s));
                return parsedSessionId ? { data: empty[0], meta } : { data: empty, meta };
            }

            const { globalStart, globalEnd } = getGlobalRange(intervals);
            const biometrics = await this.repository.getBiometricData(globalStart.toISOString(), globalEnd.toISOString());

            const reports = sessions.map((s) => this.buildReport(s, intervals, biometrics));

            if (parsedSessionId) {
                const single = reports.find(r => r.sessionId === String(parsedSessionId));
                return single ? { data: single, meta } : noDataFoundError;
            }

            return { data: reports, meta };
        } catch {
            return unknownError;
        }
    }

    private buildReport(session: Session, intervals: ContextInterval[], biometrics: BiometricSample[]): UnifiedSessionReport {
        const sIntervals = intervals
            .filter((i) => i.sessionId === session.sessionId && i.contextType === 'session')
            .sort((a, b) => a.startMinuteUtc.getTime() - b.startMinuteUtc.getTime());

        if (!sIntervals.length) return this.mapEmptyUnifiedSessionReport(session);

        const sessionStart = sIntervals[0].startMinuteUtc;
        const sessionEnd = sIntervals[sIntervals.length - 1].endMinuteUtc;
        const { preInt, postInt } = selectSessionIntervals(intervals, sessionStart, sessionEnd);

        const limitStart = preInt?.startMinuteUtc ?? sessionStart;
        const limitEnd = postInt?.endMinuteUtc ?? sessionEnd;

        const sessionData = biometrics.filter((b) => {
            const t = b.timestamp.getTime();
            return t >= limitStart.getTime() && t <= limitEnd.getTime();
        });

        if (!sessionData.length) return this.mapEmptyUnifiedSessionReport(session);

        const summary = calculateMetrics(
            sessionData,
            preInt?.startMinuteUtc,
            preInt?.endMinuteUtc,
            postInt?.startMinuteUtc,
            postInt?.endMinuteUtc,
            sessionStart,
            sessionEnd
        );

        return {
            sessionId: String(session.sessionId),
            state: session.state,
            dizzinessPercentage: calculateDizziness(session, summary),
            subjectiveAnalysis: {
                preEvaluation: Number(session.preEvaluation) || 0,
                postEvaluation: Number(session.postEvaluation) || 0,
                delta: session.state === 'completed' ? (Number(session.postEvaluation) || 0) - (Number(session.preEvaluation) || 0) : 0,
            },
            objectiveAnalysis: {
                summary,
                biometricDetails: sessionData.map((b) => {
                    const t = b.timestamp.getTime();
                    let phase: 'pre' | 'session' | 'post' | undefined;
                    if (preInt && t >= preInt.startMinuteUtc.getTime() && t <= preInt.endMinuteUtc.getTime()) phase = 'pre';
                    else if (t >= sessionStart.getTime() && t <= sessionEnd.getTime()) phase = 'session';
                    else if (postInt && t >= postInt.startMinuteUtc.getTime() && t <= postInt.endMinuteUtc.getTime()) phase = 'post';

                    return {
                        timestampIso: b.timestamp.toISOString(),
                        timestampUnixMs: t,
                        pulseRateBpm: b.pulseRateBpm,
                        edaSclUsiemens: b.edaSclUsiemens,
                        temperatureCelsius: b.temperatureCelsius,
                        accelStdG: b.accelStdG,
                        respiratoryRateBrpm: b.respiratoryRateBrpm,
                        bodyPositionType: b.bodyPositionType,
                        phase,
                    };
                }),
            },
        };
    }

    private mapEmptyUnifiedSessionReport(session: Session): UnifiedSessionReport {
        const pre = Number(session.preEvaluation) || 0;
        const post = Number(session.postEvaluation) || 0;

        return {
            sessionId: String(session.sessionId),
            state: session.state,
            dizzinessPercentage: 0,
            noBiometrics: true,
            subjectiveAnalysis: {
                preEvaluation: Number(session.preEvaluation) || 0,
                postEvaluation: Number(session.postEvaluation) || 0,
                delta: session.state === 'completed' ? post - pre : 0,            },
            objectiveAnalysis: { summary: {}, biometricDetails: [] },
        };
    }
}