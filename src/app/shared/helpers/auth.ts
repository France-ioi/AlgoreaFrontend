
export function headersForAuth(token: string): {  [name: string]: string | string[] } {
  return {
    Authorization: `Bearer ${token}`,
  };
}
