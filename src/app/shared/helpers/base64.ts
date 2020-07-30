
export function base64UrlEncode(str) {
    const base64 = btoa(str);
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
