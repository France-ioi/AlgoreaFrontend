import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: [ './top-bar.component.scss' ],
})
export class TopBarComponent {
  @Input() scrolled = false;
  @Input() modeBarDisplayed = false;
  @Input() showTopRightControls = true;
  @Input() fullFrameContentDisplayed = false;
  @Input() showLeftMenuOpener = true;
}
