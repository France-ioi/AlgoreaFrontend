export interface RequestActionResponse {
    message: string;
    success: boolean;
    data: Object;

    error_text: string;
    errors: Object;
}