import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { containsHtmlElement } from 'src/app/utils/html';
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
  minHeight = input<number | undefined>();
  maxHeight = input<number | undefined>();
  title = input<string | undefined>();

  readonly iframeMinHeightRem = computed((): string | null => {
    const v = this.minHeight();
    return v !== undefined ? `${v}rem` : null;
  });

  readonly iframeMaxHeightRem = computed((): string | null => {
    const v = this.maxHeight();
    return v !== undefined ? `${v}rem` : null;
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
</head>
<body>${bodyInner}</body>
</html>`;
    // Bypass is scoped to the `srcdoc` of an opaque-origin sandboxed iframe (sandbox="allow-scripts" only,
    // NO `allow-same-origin`). Adding `allow-same-origin` would make this bypass unsafe — author scripts
    // could then read parent cookies/storage and same-origin APIs. See also description-iframe.component.html.
    return this.sanitizer.bypassSecurityTrustHtml(srcdocHtml);
  });
}
