import { getDomain } from './domain';

describe('domain', () => {
  it('should return domain when href has no subdomain', () => {
    expect(getDomain('https://example.com')).toBe('example.com');
  });

  it('should return domain when href has subdomain', () => {
    expect(getDomain('https://sub.example.com')).toBe('example.com');
  });

  it('should return domain when domain is localhost', () => {
    expect(getDomain('http://localhost')).toBe('localhost');
  });
});
