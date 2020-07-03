export interface GenericActionResponse {
  message: string;
  success: boolean;
  data?: object;
  error_text?: string;
  errors?: object;
}

export function throwErrorOnFailure(result: GenericActionResponse) {
  if (result.success === false) {
    throw new Error('Server has returned an error');
  }
}
