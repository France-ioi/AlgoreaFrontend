export interface RequestActionResponse {
    message: string;
    success: boolean;
    data: Record<string, string>;

    error_text: string;
    errors: object;
}
