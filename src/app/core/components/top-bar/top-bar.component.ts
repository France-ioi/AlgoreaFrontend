import { Component, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'alg-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: [ './top-bar.component.scss' ],
})
export class TopBarComponent {
  @Input() showBreadcrumbs = true;
  @Input() modeBarDisplayed = false;
  @Input() showTopRightControls = true;
  @Input() showLeftMenuOpener = true;

  constructor(public elementRef: ElementRef<HTMLElement>) {
  }
}
