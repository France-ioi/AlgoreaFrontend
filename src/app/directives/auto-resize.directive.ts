import { AfterViewInit, Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: 'textarea[algAutoResize]',
  standalone: true,
})
export class AutoResizeDirective implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  @HostListener('input', [ '$event' ])
  onInput(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.renderer.setStyle(this.el.nativeElement, 'height', 'auto');
      this.renderer.setStyle(this.el.nativeElement, 'height', `${ event.target.scrollHeight }px`);
    }
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'resize', 'none');
  }
}
