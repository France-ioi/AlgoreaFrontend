export interface RequestActionResponse {
    message: string;
    success: boolean;
    data: Map<string, string>;

    error_text?: string;
    errors?: object;
}
