import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { APPCONFIG, AppConfig } from 'src/app/config';
import { DescriptionContentSecurityPolicy } from 'src/app/config/description-content-security-policy';
import { DescriptionIframeComponent } from './description-iframe.component';

describe('DescriptionIframeComponent optional Content-Security-Policy', () => {
  let fixture: ComponentFixture<DescriptionIframeComponent>;

  const allowlist: DescriptionContentSecurityPolicy = {
    styleSrc: [ 'https://styles.example' ],
    fontSrc: [ 'https://fonts.example' ],
    imgSrc: [ 'https://images.example' ],
    mediaSrc: [ 'https://media.example' ],
    connectSrc: [ 'https://api.example' ],
    frameSrc: [],
  };

  async function setup(
    descriptionContentSecurityPolicy?: DescriptionContentSecurityPolicy,
  ): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ DescriptionIframeComponent ],
      providers: [
        {
          provide: APPCONFIG,
          useValue: (descriptionContentSecurityPolicy === undefined
            ? {}
            : { descriptionContentSecurityPolicy }) as AppConfig,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DescriptionIframeComponent);
    fixture.detectChanges();
  }

  function iframeEl(): HTMLIFrameElement {
    const el = fixture.debugElement.query(By.css('iframe'));
    expect(el).toBeTruthy();
    return el.nativeElement as HTMLIFrameElement;
  }

  /**
   * Runs a probe script inside the real sandboxed opaque-origin srcdoc (same pattern as the
   * fullscreen probe). Reports CSP violations and whether the runtime helper posted a height.
   */
  async function runCspProbe(content: string): Promise<{
    heightUpdated: boolean,
    violations: { effectiveDirective: string, blockedURI: string }[],
  }> {
    const iframe = iframeEl();

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener('message', onMessage);
        reject(new Error('Timed out waiting for CSP probe message'));
      }, 8000);

      let heightUpdated = false;

      function onMessage(event: MessageEvent): void {
        if (event.source !== iframe.contentWindow) return;
        const data = event.data as {
          type?: unknown,
          violations?: { effectiveDirective: string, blockedURI: string }[],
        } | null;
        if (data !== null && typeof data === 'object' && data.type === 'alg.updateDisplay') {
          heightUpdated = true;
          return;
        }
        if (data === null || typeof data !== 'object' || data.type !== 'alg.cspProbe') return;
        window.clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
        resolve({
          heightUpdated,
          violations: Array.isArray(data.violations) ? data.violations : [],
        });
      }

      window.addEventListener('message', onMessage);
      iframe.loading = 'eager';
      iframe.scrollIntoView();
      fixture.componentRef.setInput('content', content);
      fixture.detectChanges();
    });
  }

  beforeEach(async () => {
    await setup();
  });

  it('should omit the CSP meta when the allowlist is unset', () => {
    fixture.componentRef.setInput('content', 'Plain line');
    fixture.detectChanges();

    expect(iframeEl().srcdoc).not.toContain('Content-Security-Policy');
  });

  it('should emit the CSP meta with fixed directives and configured origins when opted in', async () => {
    await setup(allowlist);
    fixture.componentRef.setInput('content', 'Plain line');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    expect(srcdoc).toContain('http-equiv="Content-Security-Policy"');
    expect(srcdoc).toContain("default-src 'none'");
    expect(srcdoc).toContain("script-src 'unsafe-inline'");
    expect(srcdoc).toContain("style-src 'unsafe-inline' https://styles.example");
    expect(srcdoc).toContain('font-src https://fonts.example');
    expect(srcdoc).toContain('img-src data: https://images.example');
    expect(srcdoc).toContain('media-src https://media.example');
    expect(srcdoc).toContain('connect-src https://api.example');
    expect(srcdoc).toContain("frame-src 'none'");
    expect(srcdoc).toContain("form-action 'none'");
    expect(srcdoc).toContain("object-src 'none'");
    expect(srcdoc).toContain("base-uri 'none'");
    expect(srcdoc).toContain("navigate-to 'none'");
    expect(srcdoc).not.toContain('https://evil.example');
    expect(srcdoc).toContain('<p>Plain line</p>');
  });

  it('should not refuse an arbitrary fetch when no allowlist is set', async () => {
    const probe = `<div><script>
(function () {
  var violations = [];
  document.addEventListener('securitypolicyviolation', function (e) {
    violations.push({ effectiveDirective: e.effectiveDirective, blockedURI: e.blockedURI });
  });
  fetch('https://evil.example/unrestricted').catch(function () {}).then(function () {
    parent.postMessage({ type: 'alg.cspProbe', violations: violations }, '*');
  });
})();
</script></div>`;

    const result = await runCspProbe(probe);
    expect(result.violations.filter(v => v.effectiveDirective === 'connect-src').length).toBe(0);
  }, 10000);

  it('should let the helper and allowed fetch/img through, and refuse the others', async () => {
    await setup(allowlist);

    // Fire network probes without awaiting them: an allowed fetch to a non-resolving host can hang
    // on DNS and blow the test timeout. CSP violations (and image errors) arrive promptly.
    const probe = `<div><script>
(function () {
  var violations = [];
  document.addEventListener('securitypolicyviolation', function (e) {
    violations.push({ effectiveDirective: e.effectiveDirective, blockedURI: e.blockedURI });
  });
  fetch('https://api.example/catalog').catch(function () {});
  fetch('https://evil.example/exfil').catch(function () {});
  var allowedImg = new Image();
  allowedImg.src = 'https://images.example/pic.png';
  var blockedImg = new Image();
  blockedImg.src = 'https://evil.example/beacon.png';
  setTimeout(function () {
    parent.postMessage({ type: 'alg.cspProbe', violations: violations }, '*');
  }, 200);
})();
</script></div>`;

    const result = await runCspProbe(probe);

    expect(result.heightUpdated).toBeTrue();

    const connectBlocked = result.violations.filter(v =>
      v.effectiveDirective === 'connect-src' && v.blockedURI.includes('evil.example'));
    expect(connectBlocked.length).toBeGreaterThan(0);

    const connectAllowed = result.violations.filter(v =>
      v.effectiveDirective === 'connect-src' && v.blockedURI.includes('api.example'));
    expect(connectAllowed.length).toBe(0);

    const imgBlocked = result.violations.filter(v =>
      v.effectiveDirective === 'img-src' && v.blockedURI.includes('evil.example'));
    expect(imgBlocked.length).toBeGreaterThan(0);

    const imgAllowed = result.violations.filter(v =>
      v.effectiveDirective === 'img-src' && v.blockedURI.includes('images.example'));
    expect(imgAllowed.length).toBe(0);
  }, 10000);
});
