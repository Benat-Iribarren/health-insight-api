import { UserRepository } from '../../../domain/interfaces/repositories/UserRepository';
import { UserId } from "@common/domain/model/UserParameters";
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

type DBClient = typeof supabaseClient;

export class SupabaseUserRepository implements UserRepository {
    constructor(
        private readonly client: DBClient
    ) {}

    async isProfessional(userId: UserId): Promise<boolean> {
        const { data, error } = await this.client
            .from('Patient')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            return true;
        }

        if (data) {
            return false;
        }

        if (error) {
            throw error;
        }

        return true;
    }

    async isPatient(userId: UserId): Promise<boolean> {
        const { data, error } = await this.client
            .from('Patient')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return !!data;
    }
}