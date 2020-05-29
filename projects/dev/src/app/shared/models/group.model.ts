export interface Group {
  id: string;
  name: string;
  type: string;
  grade: number;
  description: string;
  code?: string;
  code_lifetime?: string;
  code_expires_at?: Date;

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

export const initializeGroup = () : Group => {
  return {
    id: '',
    name: '',
    type: '',
    grade: 0,
    description: '',
    code: '',
    code_lifetime: '',
    code_expires_at: new Date(),
    current_user_is_manager: false,
    current_user_is_member: false,
    current_user_can_grant_group_access: false,
    current_user_can_manage: 'none',
    current_user_can_watch_members: false,
    open_activity_when_joining: false,
    root_activity_id: '',
    root_skill_id: '',
    is_open: false,
    is_public: false,
    open_contest: false,
    created_at: new Date()
  };
}
