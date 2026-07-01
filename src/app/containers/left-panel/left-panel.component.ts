import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LeftTabbedContentComponent } from '../left-tabbed-content/left-tabbed-content.component';
import { LeftHeaderComponent } from '../left-header/left-header.component';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'alg-left-panel',
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss',
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.tree-compact]': 'compactHeader()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.tree-expandable]': 'hideTree()',
  },
  imports: [ LeftHeaderComponent, LeftTabbedContentComponent ],
})
export class LeftPanelComponent {
  private layoutService = inject(LayoutService);

  hideTree = toSignal(this.layoutService.hideLeftMenuTree$, { initialValue: false });
  searchActive = toSignal(this.layoutService.searchActive$, { initialValue: false });
  compactHeader = computed(() => this.hideTree() && !this.searchActive());

  onSearchActiveChange(active: boolean): void {
    this.layoutService.setLeftMenuSearchActive(active);
  }
}
