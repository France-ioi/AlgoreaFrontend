import {
  AfterViewChecked,
  Directive,
  ElementRef,
  NgZone,
  OnInit,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[algFullHeightContent]',
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(window:resize)': 'resize()',
  },
})
export class FullHeightContentDirective implements OnInit, AfterViewChecked {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  algFullHeightContent = input(true);

  mainContainerEl = document.querySelector('#main-container');

  private isFirstInputEffect = true;

  constructor() {
    // ngOnInit handles the initial height; skip the first effect run to preserve that semantic.
    effect(() => {
      const enabled = this.algFullHeightContent();
      if (this.isFirstInputEffect) {
        this.isFirstInputEffect = false;
        return;
      }
      if (enabled) this.setHeight();
      else this.unsetHeight();
    });
  }

  resize(): void {
    this.setHeight();
  }

  ngOnInit(): void {
    if (window.getComputedStyle(this.el.nativeElement).display === 'inline') {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
    }
    if (this.algFullHeightContent()) this.setHeight();
  }

  ngAfterViewChecked(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        if (this.algFullHeightContent()) this.setHeight();
      });
    });
  }

  unsetHeight(): void {
    this.renderer.removeStyle(this.el.nativeElement, 'min-height');
    this.renderer.removeStyle(this.el.nativeElement, 'height');
  }

  setHeight(): void {
    const top = this.el.nativeElement.getBoundingClientRect().top + globalThis.scrollY;
    if (this.mainContainerEl) {
      const mainContainerPadding = window.getComputedStyle(this.mainContainerEl);
      this.renderer.setStyle(
        this.el.nativeElement, 'min-height', `calc(100vh - ${top + parseInt(mainContainerPadding.paddingBottom)}px)`
      );
    }
  }
}
