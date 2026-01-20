import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';

export const securityLogger = async (
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> => {
    if (request.url === '/ping' || request.routeOptions.url === '/ping') {
        return;
    }

    const user = request.user as any;
    const logEntry = {
        user_id: user?.id || null,
        endpoint: `${request.method} ${request.url}`,
        ip_address: request.ip,
        user_agent: request.headers['user-agent'] || 'UNKNOWN',
        created_at: new Date().toISOString()
    };

    supabaseClient
        .from('SecurityLogs')
        .insert([logEntry])
        .then(({ error }) => {
            if (error) console.error('Security Log Error:', error.message);
        });
};