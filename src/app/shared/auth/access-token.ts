const storageTokenKey = 'access_token';
const storageExpirationKey = 'access_token_exp';
const storageTypeKey = 'user_type';

const storage = sessionStorage;

export type Type = 'temporary'|'authenticated';

export class AccessToken {

  constructor(
    readonly accessToken: string,
    readonly expiration: Date,
    readonly type: Type
  ) {}

  static fromStorage(): AccessToken|null {
    const token = storage.getItem(storageTokenKey);
    const exp = storage.getItem(storageExpirationKey);
    const type = storage.getItem(storageTypeKey);
    if (!token || !exp) {
      return null; // not set
    }
    const expMs: number = +exp;
    if (isNaN(expMs) || expMs <= Date.now()) {
      this.clearFromStorage();
      return null; // invalid or expired expiration
    }
    if (type !== 'temporary' && type !== 'authenticated') {
      return null; // invalid type
    }
    return new AccessToken(token, new Date(expMs), type);
  }

  static fromCountdown(token: string, expiresIn: number, type: Type): AccessToken {
    return new AccessToken(token, new Date(Date.now() + expiresIn*1000), type);
  }

  static clearFromStorage() {
    storage.removeItem(storageTokenKey);
    storage.removeItem(storageExpirationKey);
    storage.removeItem(storageTypeKey);
  }

  saveToStorage() {
    storage.setItem(storageTokenKey, this.accessToken);
    storage.setItem(storageExpirationKey, this.expiration.getTime().toString());
    storage.setItem(storageTypeKey, this.type);
  }

  isValid() {
    if (!this.accessToken || this.accessToken.length === 0) return false;
    return this.expiration > new Date();
  }

}
