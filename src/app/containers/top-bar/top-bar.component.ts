import { Component, ElementRef, Input } from '@angular/core';
import { TopRightControlsComponent } from '../top-right-controls/top-right-controls.component';
import { ContentTopBarComponent } from 'src/app/containers/content-top-bar/content-top-bar.component';
import { LeftHeaderComponent } from 'src/app/containers/left-header/left-header.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: [ './top-bar.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LeftHeaderComponent,
    ContentTopBarComponent,
    TopRightControlsComponent,
  ],
})
export class TopBarComponent {
  @Input() showBreadcrumbs = true;
  @Input() modeBarDisplayed = false;
  @Input() showTopRightControls = true;
  @Input() showLeftMenuOpener = true;

  constructor(public elementRef: ElementRef<HTMLElement>) {
  }
}
