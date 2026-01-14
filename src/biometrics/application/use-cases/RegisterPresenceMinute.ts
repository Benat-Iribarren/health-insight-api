import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { ContextType } from '../../domain/models/PresenceInterval';

type Params = {
    patientId: string;
    minuteTsUtc: string;
    contextType: ContextType;
    sessionId: string | null;
};

export class RegisterPresenceMinute {
    private isUuid(value: string) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    private validate(params: Params, date: Date) {
        if (!params.patientId) throw new Error('Unauthorized');
        if (Number.isNaN(date.getTime())) throw new Error('minuteTsUtc must be a valid ISO date');
        if (date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
            throw new Error('minuteTsUtc must be rounded to the minute');
        }
        if (params.contextType !== 'dashboard' && params.contextType !== 'session') {
            throw new Error('Invalid contextType');
        }
        if (params.contextType === 'session' && (!params.sessionId || !this.isUuid(params.sessionId))) {
            throw new Error('sessionId must be a valid UUID for session context');
        }
        if (params.contextType === 'dashboard' && params.sessionId !== null) {
            throw new Error('sessionId must be null for dashboard context');
        }
    }

    async execute(params: Params) {
        const now = new Date();
        now.setUTCSeconds(0, 0);

        const minute = params.minuteTsUtc ? new Date(params.minuteTsUtc) : now;
        this.validate(params, minute);

        const endMinute = new Date(minute.getTime() + 60_000);

        const { data: lastRows, error: lastErr } = await (supabaseClient as any)
            .from('context_intervals')
            .select('id, context_type, session_id, end_minute_utc')
            .eq('patient_id', params.patientId)
            .order('start_minute_utc', { ascending: false })
            .limit(1);

        if (lastErr) throw new Error(lastErr.message);

        const last = lastRows?.[0] as any;
        const sameContext = !!last &&
            last.context_type === params.contextType &&
            (last.session_id ?? null) === params.sessionId;

        if (sameContext) {
            const lastEnd = new Date(last.end_minute_utc);
            if (endMinute > lastEnd) {
                const { data, error } = await (supabaseClient as any)
                    .from('context_intervals')
                    .update({ end_minute_utc: endMinute.toISOString() })
                    .eq('id', last.id)
                    .select().single();
                if (error) throw new Error(error.message);
                return { data, action: 'extended' };
            }
            return { data: last, action: 'idempotent_no_change' };
        }

        const { data, error } = await (supabaseClient as any)
            .from('context_intervals')
            .insert({
                patient_id: params.patientId,
                context_type: params.contextType,
                session_id: params.sessionId,
                start_minute_utc: minute.toISOString(),
                end_minute_utc: endMinute.toISOString(),
                attempt_no: params.contextType === 'session' ? 1 : null
            })
            .select().single();

        if (error) throw new Error(error.message);
        return { data, action: 'created' };
    }
}