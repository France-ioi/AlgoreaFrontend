import { ManagementLevel } from '../constants/group';
import { Duration } from '../helpers/duration';

export class Group {
  id: string;
  name: string;
  type: string;
  grade: number;
  description: string;
  code?: string;
  code_lifetime?: Duration;
  code_expires_at?: Date;

  current_user_is_manager: boolean;
  current_user_is_member: boolean;
  current_user_can_grant_group_access?: boolean;
  current_user_can_manage?: string;
  current_user_can_watch_members?: boolean;

  open_activity_when_joining: boolean;
  root_activity_id: string;
  root_skill_id: string;

  is_open: boolean;
  is_public: boolean;
  open_contest: boolean;

  created_at: Date;

  constructor(input: any = {}) {
    if (Object.keys(input).length === 0) {
      this.id = '';
      this.name = '';
      this.type = '';
      this.grade = 0;
      this.description = '';
      this.code = '';
      this.code_lifetime = null;
      this.code_expires_at = new Date();
      this.current_user_is_manager = false;
      this.current_user_is_member = false;
      this.current_user_can_grant_group_access = false;
      this.current_user_can_manage = 'none';
      this.current_user_can_watch_members = false;
      this.open_activity_when_joining = false;
      this.root_activity_id = '';
      this.root_skill_id = '';
      this.is_open = false;
      this.is_public = false;
      this.open_contest = false;
      this.created_at = new Date();
    } else {
      Object.assign(this, input);
    }
  }

  canCurrentUserManageMemberships(): boolean {
    return this.current_user_is_manager && [
      ManagementLevel.MembershipsAndGroup as string,
      ManagementLevel.Memberships as string
    ].includes(this.current_user_can_manage);
  }

  // fixme: make consistent with the fct above
  canMangeMembershipAndGroup(): boolean {
    return this.current_user_can_manage === ManagementLevel.MembershipsAndGroup;
  }

}
