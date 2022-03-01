import { AfterViewChecked, Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[algFullHeightContent]',
})
export class FullHeightContentDirective implements AfterViewChecked {
  @Input() algFullHeightContent = true;

  @HostListener('window:resize')
  resize(): void {
    this.setHeight();
  }

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {
  }

  ngAfterViewChecked(): void {
    this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
    this.setHeight();
  }

  setHeight(): void {
    if (!this.algFullHeightContent) {
      this.renderer.setStyle(this.el.nativeElement, 'min-height', '0');
      this.renderer.setStyle(this.el.nativeElement, 'height', '0');
      return;
    }
    const top = this.el.nativeElement.getBoundingClientRect().top + globalThis.scrollY;
    this.renderer.setStyle(this.el.nativeElement, 'height', null);
    this.renderer.setStyle(this.el.nativeElement, 'min-height', `calc(100vh - ${top}px)`);
  }
}
