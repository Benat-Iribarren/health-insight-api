import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';

export const securityLogger = async (
    fastify: FastifyInstance,
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> => {
    if (request.url === '/ping' || request.routeOptions.url === '/ping') return;

    let userId: string | null = (request as any).auth?.userId ?? null;

    if (!userId) {
        const authHeader = request.headers.authorization;
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.slice(7);
                const decoded = fastify.jwt.decode(token) as { sub?: string } | null;
                userId = decoded?.sub ?? null;
            } catch {
                userId = null;
            }
        }
    }

    const forwardedFor = request.headers['x-forwarded-for'];
    const ip =
        typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0].trim()
            : request.ip;

    await supabaseClient.from('SecurityLogs').insert([
        {
            user_id: userId,
            endpoint: `${request.method} ${request.url}`,
            ip_address: ip,
            user_agent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : 'UNKNOWN',
            created_at: new Date().toISOString(),
        },
    ]);
};