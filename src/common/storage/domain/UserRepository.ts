export interface UserRepository {
    isPatient(userId: string): Promise<boolean>;
}