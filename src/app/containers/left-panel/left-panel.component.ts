import { Component } from '@angular/core';
import { LeftTabbedContentComponent } from '../left-tabbed-content/left-tabbed-content.component';
import { LeftHeaderComponent } from '../left-header/left-header.component';

@Component({
  selector: 'alg-left-panel',
  templateUrl: './left-panel.component.html',
  styleUrls: [ './left-panel.component.scss' ],
  imports: [ LeftHeaderComponent, LeftTabbedContentComponent ],
})
export class LeftPanelComponent {
}
