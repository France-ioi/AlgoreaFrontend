import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[algShowOverlayHoverTarget]',
})
export class ShowOverlayHoverTargetDirective {
  nativeElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}
