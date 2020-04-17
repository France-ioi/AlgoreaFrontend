export interface Group {
    id: string;
    name: string;
    type: string;
    grade: number;
    description: string;
    activity_id: string;
    code: string;
    code_lifetime: string;
    code_expires_at: Date;

    current_user_is_manager: boolean;
    current_user_is_member: boolean;

    is_open: boolean;
    is_public: boolean;
    open_contest: boolean;

    created_at: Date;
}