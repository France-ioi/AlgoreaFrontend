import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { createSelector, Store } from '@ngrx/store';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

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
  imports: [
    NgClass,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbsComponent {
  private store = inject(Store);
  private router = inject(Router);


  breadcrumbs = this.store.selectSignal(selectBreadcrumbsDefaultOnTitle);

  onElementClick(el: { navigateTo?: () => void }): void {
    if (el.navigateTo) el.navigateTo();
  }

}
