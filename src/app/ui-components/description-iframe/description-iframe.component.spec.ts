import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DescriptionIframeComponent } from './description-iframe.component';
import { DescriptionIframeNavigationRequest } from './description-iframe.messages';
import { DESCRIPTION_IFRAME_RUNTIME_MARKER, descriptionIframeRuntimeJs } from './description-iframe.runtime';
import { DESCRIPTION_IFRAME_BASE_CSS_MARKER } from './description-iframe.styles';

describe('DescriptionIframeComponent', () => {
  let fixture: ComponentFixture<DescriptionIframeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DescriptionIframeComponent ],
    }).compileComponents();

    document.documentElement.lang = 'fr';
    document.body.removeAttribute('data-theme');

    fixture = TestBed.createComponent(DescriptionIframeComponent);
    fixture.detectChanges();
  });

  function iframeEl(): HTMLIFrameElement {
    const el = fixture.debugElement.query(By.css('iframe'));
    expect(el).toBeTruthy();
    return el.nativeElement as HTMLIFrameElement;
  }

  /**
   * Dispatches a `message` event on `window`. We can't fake `event.source` in modern browsers,
   * so we reach for `Object.defineProperty` after construction.
   */
  function dispatchMessage(source: WindowProxy | null, data: unknown): void {
    const event = new MessageEvent('message', { data });
    Object.defineProperty(event, 'source', { value: source });
    window.dispatchEvent(event);
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render an iframe with sandbox allow-scripts only', () => {
    const iframe = iframeEl();
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
  });

  it('should embed base CSS marker and author HTML in srcdoc', () => {
    fixture.componentRef.setInput('content', '<p id="author">hello</p>');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    expect(srcdoc).toContain(DESCRIPTION_IFRAME_BASE_CSS_MARKER);
    expect(srcdoc).toContain(':root {');
    expect(srcdoc).toContain('--description-content-padding-top');
    expect(srcdoc).toContain('<p id="author">hello</p>');
  });

  it('should mirror document lang and data-theme on the inner html element', () => {
    document.body.setAttribute('data-theme', 'thymio');
    fixture = TestBed.createComponent(DescriptionIframeComponent);
    fixture.componentRef.setInput('content', 'x');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    expect(srcdoc).toContain('lang="fr"');
    expect(srcdoc).toContain('data-theme="thymio"');
  });

  it('should inline theme overrides so the active theme applies inside the cross-origin iframe', () => {
    fixture.componentRef.setInput('content', 'x');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    expect(srcdoc).toContain('[data-theme=thymio]');
    expect(srcdoc).toContain('[data-theme=probabl]');
    expect(srcdoc).toContain('[data-theme=coursera-pt]');
  });

  it('should omit data-theme on the inner html element when absent on body', () => {
    document.body.removeAttribute('data-theme');
    fixture = TestBed.createComponent(DescriptionIframeComponent);
    fixture.componentRef.setInput('content', 'x');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    // The inlined theme CSS legitimately mentions `[data-theme=...]`; only assert it is not on <html>.
    expect(srcdoc).not.toMatch(/<html[^>]*data-theme/);
  });

  it('should produce an empty body for empty content without crashing', () => {
    fixture.componentRef.setInput('content', '');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    expect(srcdoc).toMatch(/<body><\/body>/);
  });

  it('should produce an empty body for whitespace-only content', () => {
    fixture.componentRef.setInput('content', '   \n\t');
    fixture.detectChanges();

    expect(iframeEl().srcdoc).toMatch(/<body><\/body>/);
  });

  it('should wrap plain text in a paragraph so reading max-width applies', () => {
    fixture.componentRef.setInput('content', 'Plain line');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    expect(srcdoc).toContain('<p>Plain line</p>');
    expect(srcdoc).not.toContain('<p><p>');
  });

  it('should escape plain text that looks like markup', () => {
    fixture.componentRef.setInput('content', 'a & b < c');
    fixture.detectChanges();

    expect(iframeEl().srcdoc).toContain('<p>a &amp; b &lt; c</p>');
  });

  it('should keep entity-encoded HTML as text and not emit a real script element', () => {
    // The HTML parser decodes `&lt;script&gt;` to characters (not a tag), so this is plain text.
    // After re-escaping, it must remain text in the iframe body — no executable <script> tag.
    fixture.componentRef.setInput('content', '&lt;script&gt;alert(1)&lt;/script&gt;');
    fixture.detectChanges();

    const srcdoc = iframeEl().srcdoc;
    const bodyMatch = /<body>([\s\S]*)<\/body>/.exec(srcdoc);
    expect(bodyMatch).not.toBeNull();
    const body = bodyMatch![1];
    expect(body).not.toContain('<script>');
    expect(body).not.toContain('</script>');
    expect(body).toContain('&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;');
  });

  describe('v2 messaging protocol', () => {
    it('should inject the runtime helper marker into the srcdoc head', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const srcdoc = iframeEl().srcdoc;
      const headMatch = /<head>([\s\S]*?)<\/head>/.exec(srcdoc);
      expect(headMatch).not.toBeNull();
      expect(headMatch![1]).toContain(DESCRIPTION_IFRAME_RUNTIME_MARKER);
      expect(headMatch![1]).toContain('alg.updateDisplay');
      expect(headMatch![1]).toContain('alg.navigate');
    });

    it('should not impose a max-height on the iframe', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const iframe = iframeEl();
      expect(iframe.style.maxHeight).toBe('');
      const computed = window.getComputedStyle(iframe);
      expect(computed.maxHeight === 'none' || computed.maxHeight === '').toBeTrue();
    });

    // The constructor wires the message listener immediately, but `viewChild` only resolves
    // after `ngAfterViewInit`. A message arriving in that window (e.g. an extension/other frame
    // broadcasting) must not throw — `viewChild.required()` did, plain `viewChild()` returns
    // undefined and the handler short-circuits.
    it('should not throw when a message arrives before the view is initialized', () => {
      const earlyFixture = TestBed.createComponent(DescriptionIframeComponent);
      // No detectChanges yet → view not initialized → iframeRef() returns undefined.
      expect(() => {
        const ev = new MessageEvent('message', { data: { type: 'alg.updateDisplay', data: { height: 1 } } });
        Object.defineProperty(ev, 'source', { value: window });
        window.dispatchEvent(ev);
      }).not.toThrow();
      earlyFixture.destroy();
    });

    // Defends against the "layout pop" before the first alg.updateDisplay lands: the SCSS floor
    // (200px by default, overridable via the [minHeight] input → CSS custom property) keeps the
    // iframe from painting at the browser default ~150px while the runtime helper is starting up.
    it('should apply a default min-height floor before the first alg.updateDisplay arrives', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const iframe = iframeEl();
      // No alg.updateDisplay dispatched yet → no inline height.
      expect(iframe.style.height).toBe('');
      // The SCSS fallback resolves to 200px (12.5rem) — assert via getComputedStyle. We tolerate
      // small browser rounding differences by parsing the leading number.
      const computedMin = parseFloat(window.getComputedStyle(iframe).minHeight);
      expect(computedMin).toBeGreaterThanOrEqual(199);
    });

    it('should let [minHeight] override the CSS variable (and therefore the SCSS floor)', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.componentRef.setInput('minHeight', 30); // 30rem
      fixture.detectChanges();

      const iframe = iframeEl();
      // The custom property is set inline and the resolved min-height matches 30rem.
      expect(iframe.style.getPropertyValue('--alg-description-iframe-min-height')).toBe('30rem');
      const computedMin = parseFloat(window.getComputedStyle(iframe).minHeight);
      const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
      expect(computedMin).toBeCloseTo(30 * rootFontSize, 0);
    });

    it('should resize the iframe height when alg.updateDisplay arrives from its source window', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const iframe = iframeEl();
      dispatchMessage(iframe.contentWindow, { type: 'alg.updateDisplay', data: { height: 321 } });
      fixture.detectChanges();

      expect(iframe.style.height).toBe('321px');
    });

    it('should ignore messages from a different source window (origin filter)', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const iframe = iframeEl();
      const before = iframe.style.height;
      // Use the test runner window itself (not the iframe's contentWindow) as the spoofed source.
      dispatchMessage(window, { type: 'alg.updateDisplay', data: { height: 999 } });
      fixture.detectChanges();

      expect(iframe.style.height).toBe(before);
    });

    it('should emit navigationRequested for valid alg.navigate payloads', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const emitted: DescriptionIframeNavigationRequest[] = [];
      fixture.componentInstance.navigationRequested.subscribe(req => emitted.push(req));

      const iframe = iframeEl();
      dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: { itemId: '42' } });
      dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: { itemId: '7', child: true } });
      dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: { url: 'https://example.com' } });

      expect(emitted).toEqual([
        { itemId: '42', child: false },
        { itemId: '7', child: true },
        { url: 'https://example.com' },
      ]);
    });

    it('should drop invalid messages without emitting or crashing', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const emitted: DescriptionIframeNavigationRequest[] = [];
      fixture.componentInstance.navigationRequested.subscribe(req => emitted.push(req));

      const iframe = iframeEl();
      const beforeHeight = iframe.style.height;

      dispatchMessage(iframe.contentWindow, { type: 'alg.unknown', data: {} });
      dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: {} });
      dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: { itemId: '' } });
      dispatchMessage(iframe.contentWindow, { type: 'alg.updateDisplay', data: { height: -10 } });
      dispatchMessage(iframe.contentWindow, { type: 'alg.scrollIntoView', data: {} });
      dispatchMessage(iframe.contentWindow, 'not an object');
      dispatchMessage(iframe.contentWindow, null);
      fixture.detectChanges();

      expect(emitted.length).toBe(0);
      expect(iframe.style.height).toBe(beforeHeight);
    });

    // Defense in depth: an author can bypass the runtime helper (which already drops javascript:)
    // and call parent.postMessage directly. The schema must reject any URL that isn't http(s).
    it('should drop alg.navigate { url } payloads with non-http(s) schemes or malformed URLs', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      const emitted: DescriptionIframeNavigationRequest[] = [];
      fixture.componentInstance.navigationRequested.subscribe(req => emitted.push(req));

      const iframe = iframeEl();
      const blocked = [
        'javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        'blob:https://example.com/abc',
        'mailto:someone@example.com',
        'tel:+1234567890',
        'ftp://example.com',
        '/relative/path',
        'relative/path',
        'about:blank',
        '',
        '   ',
        'not a url at all',
      ];
      for (const url of blocked) {
        dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: { url } });
      }
      expect(emitted.length).toBe(0);

      // Sanity: valid http(s) URLs still emit.
      dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: { url: 'http://example.com/x' } });
      dispatchMessage(iframe.contentWindow, { type: 'alg.navigate', data: { url: 'https://example.com/y' } });
      expect(emitted).toEqual([
        { url: 'http://example.com/x' },
        { url: 'https://example.com/y' },
      ]);
    });

    it('should scroll the nearest scrollable ancestor on alg.scrollIntoView', () => {
      fixture.componentRef.setInput('content', 'x');
      fixture.detectChanges();

      // Build a scrollable ancestor wrapper around the iframe so we can observe scrollTo.
      const iframe = iframeEl();
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'overflow-y: auto; height: 100px;';
      const host = iframe.parentElement!;
      host.parentElement!.insertBefore(wrapper, host);
      wrapper.appendChild(host);
      const scrollSpy = spyOn(wrapper, 'scrollTo');

      dispatchMessage(iframe.contentWindow, { type: 'alg.scrollIntoView', data: { offset: 250 } });

      expect(scrollSpy).toHaveBeenCalledTimes(1);
      const arg = scrollSpy.calls.mostRecent().args[0] as ScrollToOptions;
      expect(arg.behavior).toBe('smooth');
      expect(typeof arg.top).toBe('number');
    });
  });
});

/**
 * The runtime helper script runs *inside* the sandboxed (`allow-scripts`, no `allow-same-origin`)
 * srcdoc, whose `contentDocument` is opaque to the parent — we cannot reach into the real
 * `DescriptionIframeComponent` iframe to test it. Instead, this harness loads the same script
 * inside a non-sandboxed same-origin iframe, so we can dispatch synthetic clicks against author
 * anchors and observe the `parent.postMessage` calls that result.
 */
describe('descriptionIframeRuntimeJs (anchor click handler)', () => {
  let testIframe: HTMLIFrameElement;
  let received: unknown[];
  let listener: (event: MessageEvent) => void;

  /** A `setTimeout(0)` round-trip is enough for `parent.postMessage` to be delivered. */
  function flushMessages(): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, 0));
  }

  beforeEach(async () => {
    received = [];
    listener = (event: MessageEvent): void => {
      // Filter to our test iframe; ignore the ResizeObserver-driven `alg.updateDisplay` ticks
      // that keep firing throughout the test (browser layout/scrollbar settling). These tests
      // focus on click-handler payloads (`alg.navigate` / `alg.scrollIntoView`).
      if (event.source !== testIframe.contentWindow) return;
      const data = event.data as { type?: unknown } | null;
      if (data !== null && typeof data === 'object' && (data.type === 'alg.navigate' || data.type === 'alg.scrollIntoView')) {
        received.push(event.data);
      }
    };
    window.addEventListener('message', listener);

    testIframe = document.createElement('iframe');
    // Same-origin (no sandbox) so we can reach into contentDocument; the script we inject is the
    // exact same string that the real component embeds, so behavior matches production.
    testIframe.srcdoc = `<!doctype html><html><body>
<a id="item" data-item-id="42">item</a>
<a id="child" data-item-id="7" data-child>child</a>
<a id="datau" data-url="https://example.com/data">data-url</a>
<a id="href" href="https://example.com/page">href</a>
<a id="hash-id" href="#by-id">hash-id</a>
<a id="hash-name" href="#by-name">hash-name</a>
<a id="hash-empty" href="#">hash-empty</a>
<a id="hash-missing" href="#nope">hash-missing</a>
<a id="js" href="javascript:void(0)">js</a>
<a id="bare">bare</a>
<div style="height:600px"></div>
<div id="by-id">target by id</div>
<a name="by-name">target by name</a>
<script>${descriptionIframeRuntimeJs}</script>
</body></html>`;
    document.body.appendChild(testIframe);

    await new Promise<void>(resolve => {
      testIframe.addEventListener('load', () => resolve(), { once: true });
    });
    await flushMessages();
  });

  afterEach(() => {
    window.removeEventListener('message', listener);
    testIframe.remove();
  });

  /** Returns the dispatched event so the caller can inspect `defaultPrevented`. */
  async function clickAndAwait(id: string): Promise<MouseEvent> {
    const doc = testIframe.contentDocument!;
    const anchor = doc.getElementById(id)!;
    const view = doc.defaultView!;
    const event = new view.MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    await flushMessages();
    return event;
  }

  it('should post {url: href} for plain href anchors and prevent the default navigation', async () => {
    const event = await clickAndAwait('href');
    expect(event.defaultPrevented).toBeTrue();
    expect(received).toEqual([
      { type: 'alg.navigate', data: { url: 'https://example.com/page' } },
    ]);
  });

  it('should ask the parent to scroll for hash anchors targeting an element by id', async () => {
    const event = await clickAndAwait('hash-id');
    expect(event.defaultPrevented).toBeTrue();
    expect(received.length).toBe(1);
    const msg = received[0] as { type: string, data: { offset: number } };
    expect(msg.type).toBe('alg.scrollIntoView');
    // Target is below ~600px spacer + earlier content; we just assert it's a positive offset
    // rather than tying the test to exact layout.
    expect(typeof msg.data.offset).toBe('number');
    expect(msg.data.offset).toBeGreaterThan(0);
  });

  it('should resolve hash anchors via the legacy [name] attribute when no id matches', async () => {
    const event = await clickAndAwait('hash-name');
    expect(event.defaultPrevented).toBeTrue();
    expect(received.length).toBe(1);
    expect((received[0] as { type: string }).type).toBe('alg.scrollIntoView');
  });

  it('should swallow hash anchors with no fragment (href="#") without posting', async () => {
    const event = await clickAndAwait('hash-empty');
    expect(event.defaultPrevented).toBeTrue();
    expect(received).toEqual([]);
  });

  it('should swallow hash anchors whose target does not exist without posting', async () => {
    const event = await clickAndAwait('hash-missing');
    expect(event.defaultPrevented).toBeTrue();
    expect(received).toEqual([]);
  });

  it('should swallow javascript: hrefs without escalating to the parent', async () => {
    const event = await clickAndAwait('js');
    expect(event.defaultPrevented).toBeTrue();
    expect(received).toEqual([]);
  });

  it('should leave anchors without an href attribute alone', async () => {
    const event = await clickAndAwait('bare');
    expect(event.defaultPrevented).toBeFalse();
    expect(received).toEqual([]);
  });

  it('should post {itemId} for data-item-id anchors', async () => {
    await clickAndAwait('item');
    expect(received).toEqual([
      { type: 'alg.navigate', data: { itemId: '42', child: false } },
    ]);
  });

  it('should post {itemId, child:true} when data-child is present', async () => {
    await clickAndAwait('child');
    expect(received).toEqual([
      { type: 'alg.navigate', data: { itemId: '7', child: true } },
    ]);
  });

  it('should post {url} from data-url even when an href is also present', async () => {
    await clickAndAwait('datau');
    expect(received).toEqual([
      { type: 'alg.navigate', data: { url: 'https://example.com/data' } },
    ]);
  });
});
