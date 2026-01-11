import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';

export const securityLogger = async (
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> => {
    const user = request.user as any;
    const userId = user?.id || 'ANONYMOUS';

    const logEntry = {
        user_id: userId,
        endpoint: `${request.method} ${request.url}`,
        ip_address: request.ip,
        user_agent: request.headers['user-agent'] || 'UNKNOWN',
        created_at: new Date().toISOString(),
    };

    supabaseClient
        .from('SecurityLogs')
        .insert([logEntry])
        .then(({ error }) => {
            if (error) {
                console.error('Security Log Error:', error.message);
            }
        });
};