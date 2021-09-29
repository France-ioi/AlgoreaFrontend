
// ActionResponse is the response format returned by the backend on action (PUT/POST/DELETE) services.
export interface ActionResponse<T> {
  message: string,
  success: boolean,
  data?: T,
  errors?: object,
  error_text?: string,
}

// SimpleActionResponse is an action response with no "data"
export type SimpleActionResponse = ActionResponse<undefined>;

// CreationResponse is a response of a creation service which returns the id of the created ressource
export type CreateResponse = ActionResponse<{id: string}>;

// Extract and return the value of the "data" attribute of the response.
// Throw an error if the response is not a success or if there is no data.
// To be used in subscription pipes to map responses.
export function successData<T>(resp: ActionResponse<T>): T {
  if (resp.success === false) {
    throw new Error('Server has returned an error');
  }
  if (typeof(resp.data) === 'undefined') {
    throw new Error('The response has no data');
  }
  return resp.data;
}

// Extract and return the id from the "data" attribute of the response.
// Throw an error if the response is not a success or if there is no data.
// To be used in subscription pipes to map responses.
export function createdId(resp: CreateResponse): string {
  return successData(resp).id;
}

// Ensure that the response is a success.
// Return nothing on success and throw an error on failure.
// To be used in subscription pipes to map responses to void, or check (in tap) success.
export function assertSuccess<T>(resp: ActionResponse<T>): void {
  if (resp.success === false) {
    throw new Error('Server has returned an error');
  }
  return;
}

// Transform a JS object from a response to a typescript map
export function objectToMap(data: Object): Map<string, any> {
  return new Map(Object.entries(data));
}
