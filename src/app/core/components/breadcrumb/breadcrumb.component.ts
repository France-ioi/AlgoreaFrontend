import { Component, Input } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ContentBreadcrumb } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: [ './breadcrumb.component.scss' ],
})
export class BreadcrumbComponent {

  @Input() contentBreadcrumb?: ContentBreadcrumb

  constructor(
    private router: Router,
  ) {}

  onElementClick(el: { navigateTo?: UrlTree }): void {
    if (el.navigateTo) void this.router.navigateByUrl(el.navigateTo);
  }

}
