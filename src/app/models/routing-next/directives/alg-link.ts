import { Directive, ElementRef, HostBinding, HostListener, Input, Renderer2 } from '@angular/core';
import { AlgRouter } from '../alg-router';
import { ContentRoute } from '../content-route';

/**
 * Make this element link to some content.
 * (inspired from the (RouterLink attribute)[https://github.com/angular/angular/blob/main/packages/router/src/directives/router_link.ts])
 */
@Directive({
  selector: '[algLink]',
  standalone: true,
})
export class AlgLinkDirective {

  @Input()
  set algLink(dst: ContentRoute) {
    if (this.isAnchorElement) {
      this.applyAttributeValue('href', dst.toString());
    }
  }

  /**
   * Represents the `target` attribute on a host element.
   * This is only used when the host element is an `<a>` tag.
   */
  @HostBinding('attr.target') @Input() target?: string;

  /** Whether a host element is an `<a>` tag. */
  private isAnchorElement: boolean;

  constructor(
    private algRouter: AlgRouter,
    private readonly renderer: Renderer2,
    private readonly el: ElementRef<Element>,
  ) {
    const tagName = el.nativeElement.tagName.toLowerCase();
    this.isAnchorElement = tagName === 'a' || tagName === 'area';
  }

  @HostListener('click', [
    '$event.button',
    '$event.ctrlKey',
    '$event.shiftKey',
    '$event.altKey',
    '$event.metaKey',
  ])
  onClick(
    button: number,
    ctrlKey: boolean,
    shiftKey: boolean,
    altKey: boolean,
    metaKey: boolean,
  ): boolean {

    if (this.isAnchorElement) {
      if (button !== 0 || ctrlKey || shiftKey || altKey || metaKey) {
        return true;
      }

      if (typeof this.target === 'string' && this.target != '_self') {
        return true;
      }
    }

    this.algRouter.navigateTo(this.algLink);

    // Return `false` for `<a>` elements to prevent default action
    // and cancel the native behavior, since the navigation is handled
    // by the Router.
    return !this.isAnchorElement;
  }

  private applyAttributeValue(attrName: string, attrValue: string | null): void {
    const renderer = this.renderer;
    const nativeElement = this.el.nativeElement;
    if (attrValue !== null) {
      renderer.setAttribute(nativeElement, attrName, attrValue);
    } else {
      renderer.removeAttribute(nativeElement, attrName);
    }
  }

}
