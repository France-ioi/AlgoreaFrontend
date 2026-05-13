import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { fromEvent } from 'rxjs';
import { containsHtmlElement } from 'src/app/utils/html';
import {
  DescriptionIframeNavigationRequest,
  iframeMessageSchema,
} from './description-iframe.messages';
import { descriptionIframeRuntimeJs } from './description-iframe.runtime';
import { descriptionBaseCss } from './description-iframe.styles';

function escapeHtmlAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapePlainDescriptionText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildDescriptionBodyHtml(raw: string): string {
  if (raw.trim() === '') return '';
  if (containsHtmlElement(raw)) return raw;
  return `<p>${escapePlainDescriptionText(raw)}</p>`;
}

@Component({
  selector: 'alg-description-iframe',
  templateUrl: './description-iframe.component.html',
  styleUrls: [ './description-iframe.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionIframeComponent {
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Snapshotted at construct time on purpose:
   * - `data-theme` is set once at app bootstrap (`app.component.ts`) and never mutates afterward.
   * - The active language is fixed for the lifetime of the page (i18n changes trigger a full reload).
   * If either assumption changes, this snapshot must become reactive (or a `Renderer2` watcher).
   */
  private readonly iframeLang = this.document.documentElement.lang || 'en';
  private readonly iframeTheme = this.document.body.getAttribute('data-theme');

  readonly fallbackTitle = $localize`:@@descriptionIframeTitle:Description`;

  content = input<string | null | undefined>();
  /**
   * Optional floor (rem) for the iframe height. Drives the `--alg-description-iframe-min-height`
   * CSS custom property so it overrides the SCSS default (200px) before the first
   * `alg.updateDisplay` lands. Once the message arrives, the inline `[style.height]` applies on
   * top of this floor.
   */
  minHeight = input<number | undefined>();
  title = input<string | undefined>();

  navigationRequested = output<DescriptionIframeNavigationRequest>();

  /**
   * Non-required on purpose: the `message` listener subscribes in the constructor (so we don't
   * miss any message), but `viewChild` only resolves after `ngAfterViewInit`. Using `.required`
   * here would throw if any message arrived in that window — including unrelated cross-window
   * broadcasts from extensions or other frames sharing the page.
   */
  private readonly iframeRef = viewChild<ElementRef<HTMLIFrameElement>>('iframe');

  /** Driven by `alg.updateDisplay` messages from inside the iframe; null until the first message. */
  private readonly contentHeightPx = signal<number | null>(null);

  readonly iframeHeightStyle = computed((): string | null => {
    const px = this.contentHeightPx();
    return px !== null ? `${px}px` : null;
  });

  readonly iframeMinHeightVar = computed((): string | null => {
    const m = this.minHeight();
    return m !== undefined ? `${m}rem` : null;
  });

  readonly resolvedTitle = computed((): string => this.title() ?? this.fallbackTitle);

  readonly srcdoc = computed((): SafeHtml => {
    const raw = this.content() ?? '';
    const bodyInner = buildDescriptionBodyHtml(raw);
    const themeAttr =
      this.iframeTheme !== null
        ? ` data-theme="${escapeHtmlAttributeValue(this.iframeTheme)}"`
        : '';
    const langAttr = escapeHtmlAttributeValue(this.iframeLang);
    const srcdocHtml = `<!doctype html>
<html lang="${langAttr}"${themeAttr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${descriptionBaseCss}</style>
<script>${descriptionIframeRuntimeJs}</script>
</head>
<body>${bodyInner}</body>
</html>`;
    // Bypass is scoped to the `srcdoc` of an opaque-origin sandboxed iframe (sandbox="allow-scripts" only,
    // NO `allow-same-origin`). Adding `allow-same-origin` would make this bypass unsafe — author scripts
    // could then read parent cookies/storage and same-origin APIs. The injected runtime helper is a
    // string literal owned by us, so trusting it for `bypassSecurityTrustHtml` adds no new attack surface.
    // See also description-iframe.component.html.
    return this.sanitizer.bypassSecurityTrustHtml(srcdocHtml);
  });

  constructor() {
    const win = this.document.defaultView;
    if (!win) return;
    fromEvent<MessageEvent>(win, 'message')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.handleMessage(event));
  }

  private handleMessage(event: MessageEvent): void {
    // Sandbox is `allow-scripts` only, so `event.origin` is the literal string "null" — useless.
    // Identifying the source via `contentWindow` is the only reliable filter here.
    const iframe = this.iframeRef()?.nativeElement;
    if (!iframe || event.source !== iframe.contentWindow) return;

    const parsed = iframeMessageSchema.safeParse(event.data);
    if (!parsed.success) return;

    const message = parsed.data;
    switch (message.type) {
      case 'alg.updateDisplay':
        this.contentHeightPx.set(message.data.height);
        return;
      case 'alg.navigate':
        this.navigationRequested.emit(message.data);
        return;
      case 'alg.scrollIntoView':
        this.scrollAncestorTo(iframe, message.data.offset);
        return;
    }
  }

  /**
   * Scroll the nearest scrollable ancestor of the iframe so that the target Y offset (relative
   * to the top of the iframe document) lands at the top of the visible area. Falls back to the
   * window if no scrollable ancestor is found.
   */
  private scrollAncestorTo(iframe: HTMLIFrameElement, offsetInIframe: number): void {
    const win = this.document.defaultView;
    if (!win) return;
    const container = findScrollableAncestor(iframe, win);
    const iframeRect = iframe.getBoundingClientRect();
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const top = container.scrollTop + (iframeRect.top - containerRect.top) + offsetInIframe;
      container.scrollTo({ top, behavior: 'smooth' });
    } else {
      win.scrollTo({ top: iframeRect.top + win.scrollY + offsetInIframe, behavior: 'smooth' });
    }
  }
}

/** Walks up from `el` looking for the first ancestor whose computed `overflow-y` actually scrolls. */
function findScrollableAncestor(el: Element, win: Window): HTMLElement | null {
  let p: Element | null = el.parentElement;
  while (p) {
    const overflowY = win.getComputedStyle(p).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return p as HTMLElement;
    p = p.parentElement;
  }
  return null;
}
