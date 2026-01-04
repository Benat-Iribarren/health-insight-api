import { UserId } from "@common/domain/model/UserParameters";

export interface UserRepository {
    isProfessional(userId: UserId): Promise<boolean>;
    isPatient(userId: UserId): Promise<boolean>;
}