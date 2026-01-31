import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';

export const securityLogger = async (
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> => {
    if (request.url === '/ping' || request.routeOptions.url === '/ping') return;

    let userId: string | null = request.auth?.userId ?? null;

    if (!userId) {
        const authHeader = request.headers.authorization;
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            try {
                await request.jwtVerify();
                const decoded = request.user as { sub?: string };
                userId = decoded?.sub ?? null;
            } catch {
                userId = null;
            }
        }
    }

    const logEntry = {
        user_id: userId,
        endpoint: `${request.method} ${request.url}`,
        ip_address: request.ip,
        user_agent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : 'UNKNOWN',
        created_at: new Date().toISOString(),
    };

    supabaseClient.from('SecurityLogs').insert([logEntry]);
};
