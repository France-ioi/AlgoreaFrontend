import { Component, Input } from '@angular/core';
import { ContentBreadcrumb } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {

  @Input() contentBreadcrumb?: ContentBreadcrumb

  onElementClick(_el: { title: string, hintNumber?: number}) {
    // to do go to path
  }

}
