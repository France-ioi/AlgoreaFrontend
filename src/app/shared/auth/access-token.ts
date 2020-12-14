import { MINUTES, SECONDS } from '../helpers/duration';

const storageTokenKey = 'access_token';
const storageCreationKey = 'access_token_creat';
const storageExpirationKey = 'access_token_exp';
const storageTypeKey = 'user_type';

const storage = sessionStorage;

// The minimum token lifetime we accept.
// It is also the lifetime under which we refresh the token.
export const minTokenLifetime = 5*MINUTES;

export type Type = 'temporary'|'authenticated';

export class AccessToken {

  constructor(
    readonly accessToken: string,
    readonly creation: Date,
    readonly expiration: Date,
    readonly type: Type
  ) {}

  static fromStorage(): AccessToken|null {
    const token = storage.getItem(storageTokenKey);
    const exp = storage.getItem(storageExpirationKey);
    const creation = storage.getItem(storageCreationKey);
    const type = storage.getItem(storageTypeKey);
    if (!token || !exp || !creation) {
      return null; // not set
    }
    const expMs: number = +exp;
    const createMs: number = +creation;
    if (isNaN(expMs) || expMs <= Date.now() || isNaN(createMs)) {
      this.clearFromStorage();
      return null; // invalid or expired expiration
    }
    if (type !== 'temporary' && type !== 'authenticated') {
      return null; // invalid type
    }
    return new AccessToken(token, new Date(createMs), new Date(expMs), type);
  }

  // Create from a number of seconds before expiry and using now as creation time
  static fromTTL(token: string, expiresIn: number, type: Type): AccessToken {
    if (expiresIn < minTokenLifetime/SECONDS) {
      throw new Error(`Cannot use a new token shorter than ${minTokenLifetime/MINUTES} min (received: ${expiresIn} sec)`);
    }
    return new AccessToken(token, new Date(), new Date(Date.now() + expiresIn*1000), type);
  }

  static clearFromStorage(): void {
    storage.removeItem(storageTokenKey);
    storage.removeItem(storageCreationKey);
    storage.removeItem(storageExpirationKey);
    storage.removeItem(storageTypeKey);
  }

  saveToStorage(): void {
    storage.setItem(storageTokenKey, this.accessToken);
    storage.setItem(storageCreationKey, this.creation.getTime().toString());
    storage.setItem(storageExpirationKey, this.expiration.getTime().toString());
    storage.setItem(storageTypeKey, this.type);
  }

  isValid(): boolean {
    if (!this.accessToken || this.accessToken.length === 0) return false;
    return this.expiration > new Date();
  }

}
