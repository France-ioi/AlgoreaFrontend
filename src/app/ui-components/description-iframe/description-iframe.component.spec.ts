import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DescriptionIframeComponent } from './description-iframe.component';
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
});
