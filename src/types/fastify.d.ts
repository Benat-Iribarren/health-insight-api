import { UserId } from '@common/domain/model/UserParamaters';
import * as fastify from 'fastify';

declare module 'fastify' {
    export interface FastifyRequest {
        user?: {
            id: UserId;
        };
    }
}