import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';

@Component({
  selector: 'alg-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: [ './breadcrumb.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    TooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {

  breadcrumbs = this.store.selectSignal(fromCurrentContent.selectBreadcrumbs);

  constructor(
    private store: Store,
    private router: Router,
  ) {}

  onElementClick(el: { navigateTo?: UrlTree|(() => UrlTree) }): void {
    if (el.navigateTo) {
      const dest = 'root' in el.navigateTo ? el.navigateTo : el.navigateTo();
      void this.router.navigateByUrl(dest);
    }
  }

}
