import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
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

  onElementClick(el: { navigateTo?: any[] }): void {
    if (el.navigateTo) void this.router.navigate(el.navigateTo);
  }

}
