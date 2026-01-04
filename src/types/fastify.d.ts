import { UserId } from '@common/domain/model/UserParameters';
import * as fastify from 'fastify';

declare module 'fastify' {
    export interface FastifyRequest {
        user?: {
            id: UserId;
        };
    }
}