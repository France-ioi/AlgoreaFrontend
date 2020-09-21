import { Component, Input } from '@angular/core';
import { PageInfo } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {

  @Input() pageInfo: PageInfo|null

  onElementClick(_el: { title: string, attemptOrder?: number}) {
    // to do go to path
  }

}
