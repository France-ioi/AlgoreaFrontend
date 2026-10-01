import { DOCUMENT } from '@angular/common';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { AppVersionCheckService } from './app-version-check.service';
import { MINUTES, SECONDS } from 'src/app/utils/duration';

const HEARTBEAT_INTERVAL_MS = 30 * SECONDS;
const OFFLINE_RETRY_DELAY_MS = 2 * SECONDS;
const DEPLOYED_HTML = '<html><head><meta name="app-version" content="2.0.0"></head></html>';

describe('AppVersionCheckService', () => {
  let service: AppVersionCheckService;
  let httpTesting: HttpTestingController;
  let document: Document;
  let wakeTarget: EventTarget;
  let visibilityState: DocumentVisibilityState;
  let subscription: Subscription | undefined;

  function setup(initialVisibility: DocumentVisibilityState = 'visible'): void {
    visibilityState = initialVisibility;
    wakeTarget = new EventTarget();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: DOCUMENT,
          useFactory: (): Document => {
            const doc = window.document.implementation.createHTMLDocument('test');
            const base = doc.createElement('base');
            base.href = 'https://example.test/';
            doc.head.appendChild(base);
            Object.defineProperty(doc, 'visibilityState', {
              configurable: true,
              get: (): DocumentVisibilityState => visibilityState,
            });
            Object.defineProperty(doc, 'defaultView', {
              configurable: true,
              get: (): Window => wakeTarget as unknown as Window,
            });
            const meta = doc.createElement('meta');
            meta.setAttribute('name', 'app-version');
            meta.setAttribute('content', '1.0.0');
            doc.head.appendChild(meta);
            return doc;
          },
        },
      ],
    });
    service = TestBed.inject(AppVersionCheckService);
    httpTesting = TestBed.inject(HttpTestingController);
    document = TestBed.inject(DOCUMENT);
  }

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date());
    setup();
  });

  afterEach(() => {
    subscription?.unsubscribe();
    subscription = undefined;
    httpTesting.verify();
    jasmine.clock().uninstall();
  });

  function setMetaContent(content: string): void {
    document.querySelector('meta[name="app-version"]')?.setAttribute('content', content);
  }

  function dispatchVisibility(state: DocumentVisibilityState): void {
    visibilityState = state;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  /** Advance wall clock without running timers (simulates JS freeze / system sleep). */
  function sleep(ms: number): void {
    jasmine.clock().mockDate(new Date(Date.now() + ms));
  }

  function becomeVisibleAfterHidden(msHidden: number): void {
    dispatchVisibility('hidden');
    jasmine.clock().tick(msHidden);
    dispatchVisibility('visible');
  }

  function subscribe(): unknown[] {
    const emissions: unknown[] = [];
    subscription = service.newVersionAvailable$.subscribe(v => emissions.push(v));
    return emissions;
  }

  function expectVersionFetch(): void {
    httpTesting.expectOne(r => r.url.startsWith('https://example.test/')).flush(DEPLOYED_HTML);
  }

  function dispatchUserInput(type: 'pointerdown' | 'keydown'): void {
    document.dispatchEvent(new Event(type));
  }

  it('does not fetch when hidden for less than 20 minutes', () => {
    const emissions = subscribe();
    becomeVisibleAfterHidden(19 * MINUTES);
    httpTesting.expectNone(() => true);
    expect(emissions).toEqual([]);
  });

  it('emits when deployed version differs after ≥ 20 minutes hidden', () => {
    const emissions = subscribe();
    becomeVisibleAfterHidden(20 * MINUTES);
    const req = httpTesting.expectOne(r => r.url.startsWith('https://example.test/'));
    expect(req.request.responseType).toBe('text');
    expect(req.request.headers.get('Cache-Control')).toBe('no-cache');
    expect(req.request.url).toContain('_=');
    req.flush(DEPLOYED_HTML);
    expect(emissions.length).toBe(1);
  });

  it('checks on first reveal when the tab opened already hidden', () => {
    TestBed.resetTestingModule();
    jasmine.clock().uninstall();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date());
    setup('hidden');
    const emissions = subscribe();
    jasmine.clock().tick(20 * MINUTES);
    dispatchVisibility('visible');
    expectVersionFetch();
    expect(emissions.length).toBe(1);
  });

  it('does not emit when deployed version matches or meta is missing/empty', () => {
    const emissions = subscribe();
    becomeVisibleAfterHidden(20 * MINUTES);
    httpTesting.expectOne(r => r.url.startsWith('https://example.test/'))
      .flush('<html><head><meta name="app-version" content="1.0.0"></head></html>');
    becomeVisibleAfterHidden(20 * MINUTES);
    httpTesting.expectOne(r => r.url.startsWith('https://example.test/'))
      .flush('<html><head><meta name="app-version" content=""></head></html>');
    becomeVisibleAfterHidden(20 * MINUTES);
    httpTesting.expectOne(r => r.url.startsWith('https://example.test/')).flush('<html><head></head></html>');
    setMetaContent('');
    becomeVisibleAfterHidden(20 * MINUTES);
    expectVersionFetch();
    expect(emissions).toEqual([]);
  });

  it('silently ignores non-offline HTTP errors after long hide', () => {
    const emissions: unknown[] = [];
    subscription = service.newVersionAvailable$.subscribe({
      next: v => emissions.push(v),
      error: () => emissions.push('error'),
    });
    becomeVisibleAfterHidden(20 * MINUTES);
    httpTesting.expectOne(r => r.url.startsWith('https://example.test/'))
      .flush('fail', { status: 500, statusText: 'Server Error' });
    expect(emissions).toEqual([]);
  });

  it('emits at most once per session after long hide', () => {
    const emissions = subscribe();
    becomeVisibleAfterHidden(20 * MINUTES);
    expectVersionFetch();
    expect(emissions.length).toBe(1);
    becomeVisibleAfterHidden(20 * MINUTES);
    httpTesting.expectNone(r => r.url.startsWith('https://example.test/'));
    expect(emissions.length).toBe(1);
  });

  describe('sleep / lid-close gap', () => {
    it('fetches after heartbeat detects a ≥ 20 minute sleep gap', () => {
      const emissions = subscribe();
      sleep(20 * MINUTES);
      jasmine.clock().tick(HEARTBEAT_INTERVAL_MS);
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('fetches on capture-phase pointerdown from a non-bubbling body event', () => {
      const emissions = subscribe();
      sleep(20 * MINUTES);
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: false }));
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('fetches on keydown after sleep without waiting for heartbeat', () => {
      const emissions = subscribe();
      sleep(20 * MINUTES);
      dispatchUserInput('keydown');
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('does not reset the gap on sub-threshold input', () => {
      const emissions = subscribe();
      sleep(19 * MINUTES);
      dispatchUserInput('pointerdown');
      sleep(1 * MINUTES);
      dispatchUserInput('pointerdown');
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('does not fetch after 19 min sleep, normal clicks, or regular heartbeats', () => {
      const emissions = subscribe();
      sleep(19 * MINUTES);
      document.dispatchEvent(new Event('resume'));
      jasmine.clock().tick(HEARTBEAT_INTERVAL_MS);
      dispatchUserInput('pointerdown');
      dispatchUserInput('keydown');
      for (let elapsed = 0; elapsed < 40 * MINUTES; elapsed += HEARTBEAT_INTERVAL_MS) {
        jasmine.clock().tick(HEARTBEAT_INTERVAL_MS);
      }
      httpTesting.expectNone(() => true);
      expect(emissions).toEqual([]);
    });

    it('makes a single request when input, heartbeat, and focus fire together', () => {
      const emissions = subscribe();
      sleep(20 * MINUTES);
      dispatchUserInput('pointerdown');
      jasmine.clock().tick(HEARTBEAT_INTERVAL_MS);
      wakeTarget.dispatchEvent(new Event('focus'));
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('does not fetch on pointerdown while hidden after sleep', () => {
      const emissions = subscribe();
      dispatchVisibility('hidden');
      sleep(20 * MINUTES);
      dispatchUserInput('pointerdown');
      httpTesting.expectNone(() => true);
      expect(emissions).toEqual([]);
    });

    it('fetches when queued hidden then visible run only after sleep thaw', () => {
      const emissions = subscribe();
      sleep(20 * MINUTES);
      dispatchVisibility('hidden');
      dispatchVisibility('visible');
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('uses hide-duration check when sleep happens while hidden', () => {
      const emissions = subscribe();
      dispatchVisibility('hidden');
      sleep(20 * MINUTES);
      jasmine.clock().tick(HEARTBEAT_INTERVAL_MS);
      httpTesting.expectNone(() => true);
      dispatchVisibility('visible');
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('retries once after an offline wake fetch', () => {
      const emissions = subscribe();
      sleep(20 * MINUTES);
      dispatchUserInput('pointerdown');
      httpTesting.expectOne(r => r.url.startsWith('https://example.test/'))
        .error(new ProgressEvent('error'));
      jasmine.clock().tick(OFFLINE_RETRY_DELAY_MS);
      expectVersionFetch();
      expect(emissions.length).toBe(1);
    });

    it('emits at most once per session after sleep wake', () => {
      const emissions = subscribe();
      sleep(20 * MINUTES);
      dispatchUserInput('pointerdown');
      expectVersionFetch();
      expect(emissions.length).toBe(1);
      sleep(20 * MINUTES);
      dispatchUserInput('pointerdown');
      document.dispatchEvent(new Event('resume'));
      jasmine.clock().tick(HEARTBEAT_INTERVAL_MS);
      httpTesting.expectNone(r => r.url.startsWith('https://example.test/'));
      expect(emissions.length).toBe(1);
    });
  });
});
