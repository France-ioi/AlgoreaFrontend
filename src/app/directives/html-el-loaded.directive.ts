import { AfterViewInit, Directive, ElementRef, EventEmitter, inject, Output } from '@angular/core';

@Directive({
  selector: '[algHtmlElLoaded]',
  standalone: true,
})
export class HtmlElLoadedDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  @Output() elLoaded = new EventEmitter<HTMLElement>();

  ngAfterViewInit(): void {
    this.elLoaded.emit(this.el.nativeElement);
  }
}
