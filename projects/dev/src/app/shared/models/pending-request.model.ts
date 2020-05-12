import { User } from './user.model';

export interface PendingRequest {
    member_id: string;
    at: Date;
    action: string;
    joining_user: User;
    inviting_user: User;
}
