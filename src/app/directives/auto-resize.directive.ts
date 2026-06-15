import { AfterViewInit, Directive, ElementRef, inject, Renderer2 } from '@angular/core';

@Directive({
  selector: 'textarea[algAutoResize]',
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Angular host event binding
    '(input)': 'onInput($event)',
  },
})
export class AutoResizeDirective implements AfterViewInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

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
