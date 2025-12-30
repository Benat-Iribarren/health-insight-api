import { DBClientService } from '../domain/DBClientService';
import { UserRepository } from '../domain/UserRepository';

export class SupabaseUserRepository implements UserRepository {
    constructor(private readonly dbClient: DBClientService) {}

    async isPatient(userId: string): Promise<boolean> {
        const { data } = await this.dbClient
            .from('Patient')
            .select('id')
            .eq('user_id', userId)
            .single();

        return !!data;
    }
}