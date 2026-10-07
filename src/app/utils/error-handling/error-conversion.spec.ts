import { HttpErrorResponse } from '@angular/common/http';
import { convertToError, HTTPError, UnknownError } from './error-conversion';

describe('convertToError', () => {
  it('returns Error instances unchanged', () => {
    const err = new Error('boom');
    expect(convertToError(err)).toBe(err);
  });

  it('wraps HttpErrorResponse as HTTPError', () => {
    const httpErr = new HttpErrorResponse({ status: 500, statusText: 'KO', url: '/x' });
    const converted = convertToError(httpErr);
    expect(converted).toEqual(jasmine.any(HTTPError));
    expect(converted.message).toBe(httpErr.message);
  });

  it('converts error-like objects with getter name/message (XPCOM-style)', () => {
    // Prototype getters mimic Firefox XPCOM exceptions (not own enumerable fields).
    const proto = {};
    Object.defineProperty(proto, 'name', { get: (): string => 'NS_ERROR_FAILURE' });
    Object.defineProperty(proto, 'message', { get: (): string => '' });
    Object.defineProperty(proto, 'stack', { get: (): string => 'fake-stack' });
    const fakeXpcom = Object.create(proto) as object;

    const converted = convertToError(fakeXpcom);
    expect(converted).not.toEqual(jasmine.any(UnknownError));
    expect(converted.name).toBe('NS_ERROR_FAILURE');
    expect(converted.message).toBe('');
    expect(converted.stack).toBe('fake-stack');
  });

  it('uses custom toString when JSON.stringify yields {}', () => {
    const opaque = {
      toString(): string {
        return 'Component returned failure code: 0x80004005';
      },
    };
    const converted = convertToError(opaque);
    expect(converted).toEqual(jasmine.any(UnknownError));
    expect(converted.message).toBe('Component returned failure code: 0x80004005');
  });

  it('still JSON.stringifies plain objects with enumerable data', () => {
    const converted = convertToError({ foo: 'bar' });
    expect(converted).toEqual(jasmine.any(UnknownError));
    expect(converted.message).toBe('{"foo":"bar"}');
  });

  it('falls back to UnknownError when only one of name/message is a string', () => {
    expect(convertToError({ name: 'NS_ERROR_FAILURE', message: 42 })).toEqual(jasmine.any(UnknownError));
    expect(convertToError({ name: 42, message: 'oops' })).toEqual(jasmine.any(UnknownError));
  });

  it('does not throw when a name/message getter throws', () => {
    const proto = {};
    Object.defineProperty(proto, 'name', {
      get: (): string => {
        throw new Error("can't access dead object");
      },
    });
    Object.defineProperty(proto, 'message', { get: (): string => '' });
    const deadObject = Object.create(proto) as object;

    expect(() => convertToError(deadObject)).not.toThrow();
    expect(convertToError(deadObject)).toEqual(jasmine.any(UnknownError));
  });
});
