import { AfterViewChecked, Directive, ElementRef, HostListener, Input, NgZone, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[algFullHeightContent]',
})
export class FullHeightContentDirective implements AfterViewChecked, OnChanges {
  @Input() algFullHeightContent = true;

  @HostListener('window:resize')
  resize(): void {
    this.setHeight();
  }

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2, private ngZone: NgZone) {
  }

  ngAfterViewChecked(): void {
    this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        if (this.algFullHeightContent) this.setHeight();
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.algFullHeightContent && !changes.algFullHeightContent.firstChange) {
      this.algFullHeightContent ? this.setHeight() : this.unsetHeight();
    }
  }

  unsetHeight(): void {
    this.renderer.removeStyle(this.el.nativeElement, 'min-height');
    this.renderer.removeStyle(this.el.nativeElement, 'height');
  }

  setHeight(): void {
    const top = this.el.nativeElement.getBoundingClientRect().top + globalThis.scrollY;
    this.renderer.removeStyle(this.el.nativeElement, 'height');
    this.renderer.setStyle(this.el.nativeElement, 'min-height', `calc(100vh - ${top}px)`);
  }
}
