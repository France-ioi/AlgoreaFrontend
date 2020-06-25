export interface GenericResponse {
  message: string;
  success: boolean;

  error_text?: string;
  errors?: object;
}
