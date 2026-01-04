import { UserId } from "@common/domain/model/UserParamaters";

export interface UserRepository {
    isProfessional(userId: UserId): Promise<boolean>;
    isPatient(userId: UserId): Promise<boolean>;
}