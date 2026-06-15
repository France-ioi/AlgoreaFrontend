import { AfterViewInit, Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[algHtmlElLoaded]',
})
export class HtmlElLoadedDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  elLoaded = output<HTMLElement>();

  ngAfterViewInit(): void {
    this.elLoaded.emit(this.el.nativeElement);
  }
}
