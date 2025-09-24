import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { createSelector, Store } from '@ngrx/store';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';

/**
 * When there is no breadcrumb, use the title as unique breadcrumb
 */
const selectBreadcrumbsDefaultOnTitle = createSelector(
  fromCurrentContent.selectBreadcrumbs,
  fromCurrentContent.selectTitle,
  (breadcrumbs, title) => breadcrumbs ?? (title ? [{ title }] : undefined)
);

@Component({
  selector: 'alg-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: [ './breadcrumbs.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    TooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbsComponent {

  breadcrumbs = this.store.selectSignal(selectBreadcrumbsDefaultOnTitle);

  constructor(
    private store: Store,
    private router: Router,
  ) {}

  onElementClick(el: { navigateTo?: () => void }): void {
    if (el.navigateTo) el.navigateTo();
  }

}
