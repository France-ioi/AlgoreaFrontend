export interface Group {
  id: string;
  name: string;
  type: string;
  grade: number;
  description: string;
  code: string;
  code_lifetime: string;
  code_expires_at: Date;

  current_user_is_manager: boolean;
  current_user_is_member: boolean;
  current_user_can_grant_group_access: boolean;
  current_user_can_manage: string;
  current_user_can_watch_members: boolean;

  open_activity_when_joining: boolean;
  root_activity_id: string;
  root_skill_id: string;

  is_open: boolean;
  is_public: boolean;
  open_contest: boolean;

  created_at: Date;
}
