import { isHttpsAbsoluteUrl, openHttpsDownloadUrl } from './open-https-download-url';

describe('openHttpsDownloadUrl', () => {
  it('accepts absolute https URLs', () => {
    expect(isHttpsAbsoluteUrl('https://cdn.example/file.zip')).toBeTrue();
  });

  it('rejects http, relative, and invalid URLs', () => {
    expect(isHttpsAbsoluteUrl('http://cdn.example/file.zip')).toBeFalse();
    expect(isHttpsAbsoluteUrl('/relative/path')).toBeFalse();
    expect(isHttpsAbsoluteUrl('not a url')).toBeFalse();
  });

  it('opens https URLs via a temporary anchor and returns true', () => {
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
    const createSpy = spyOn(document, 'createElement').and.callThrough();

    expect(openHttpsDownloadUrl('https://cdn.example/file.zip')).toBeTrue();
    expect(createSpy).toHaveBeenCalledWith('a');
    const anchor = createSpy.calls.mostRecent().returnValue as HTMLAnchorElement;
    expect(anchor.href).toContain('https://cdn.example/file.zip');
    expect(anchor.target).toBe('_blank');
    expect(anchor.rel).toContain('noopener');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('does not navigate for non-https URLs', () => {
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
    expect(openHttpsDownloadUrl('http://evil.example/x')).toBeFalse();
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
