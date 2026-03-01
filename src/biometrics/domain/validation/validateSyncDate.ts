export type SyncDateValidation =
    | { ok: true; value: string }
    | { ok: false; reason: 'invalid_format' | 'invalid_date' };

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateSyncDate(input: string): SyncDateValidation {
    if (!ISO_DAY_RE.test(input)) return { ok: false, reason: 'invalid_format' };

    const ms = Date.parse(input);
    if (Number.isNaN(ms)) return { ok: false, reason: 'invalid_date' };

    return { ok: true, value: input };
}