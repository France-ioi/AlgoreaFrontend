import { Component, ElementRef, Input, inject } from '@angular/core';
import { TopRightControlsComponent } from '../top-right-controls/top-right-controls.component';
import { ContentTopBarComponent } from 'src/app/containers/content-top-bar/content-top-bar.component';
import { LeftHeaderComponent } from 'src/app/containers/left-header/left-header.component';


@Component({
  selector: 'alg-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: [ './top-bar.component.scss' ],
  imports: [
    LeftHeaderComponent,
    ContentTopBarComponent,
    TopRightControlsComponent,
  ]
})
export class TopBarComponent {
  elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() showBreadcrumbs = true;
  @Input() modeBarDisplayed = false;
  @Input() showTopRightControls = true;
  @Input() showLeftMenuOpener = true;
}
