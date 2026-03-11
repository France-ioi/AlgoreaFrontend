import { Component, inject } from '@angular/core';
import { APPCONFIG } from 'src/app/config';
import { LeftTabbedContentComponent } from '../left-tabbed-content/left-tabbed-content.component';
import { LeftMenuSearchComponent } from '../../ui-components/left-menu-search/left-menu-search.component';
import { LeftHeaderComponent } from '../left-header/left-header.component';

@Component({
  selector: 'alg-left-panel',
  templateUrl: './left-panel.component.html',
  styleUrls: [ './left-panel.component.scss' ],
  imports: [ LeftHeaderComponent, LeftTabbedContentComponent, LeftMenuSearchComponent ]
})
export class LeftPanelComponent {
  private config = inject(APPCONFIG);

  menuSearchEnabled = !!this.config.searchApiUrl;

  searchQuery = '';
}
