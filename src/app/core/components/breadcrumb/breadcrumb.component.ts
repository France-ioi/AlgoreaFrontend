import { Component, Input } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ContentBreadcrumb } from 'src/app/shared/models/content/content-breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { NgIf, NgFor, NgClass } from '@angular/common';

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
})
export class BreadcrumbComponent {

  @Input() contentBreadcrumb?: ContentBreadcrumb;

  constructor(
    private router: Router,
  ) {}

  onElementClick(el: { navigateTo?: UrlTree|(() => UrlTree) }): void {
    if (el.navigateTo) {
      const dest = 'root' in el.navigateTo ? el.navigateTo : el.navigateTo();
      void this.router.navigateByUrl(dest);
    }
  }

}
