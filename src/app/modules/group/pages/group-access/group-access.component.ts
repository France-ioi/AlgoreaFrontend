import { Component, Input, OnChanges } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetItemByIdService } from '../../../item/http-services/get-item-by-id.service';
import { ReplaySubject } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { isNotNull } from '../../../../shared/helpers/null-undefined-predicates';
import { mapToFetchState } from '../../../../shared/operators/state';

@Component({
  selector: 'alg-group-access',
  templateUrl: './group-access.component.html',
  styleUrls: [ './group-access.component.scss' ],
})
export class GroupAccessComponent implements OnChanges {
  @Input() group?: Group;

  private readonly rootActivityId$ = new ReplaySubject<string | null>(1);

  itemState$ = this.rootActivityId$.pipe(
    filter(isNotNull),
    switchMap(rootActivityId =>
      this.getItemByIdService.get(rootActivityId).pipe(
        mapToFetchState(),
      )
    ),
  );

  constructor(private getItemByIdService: GetItemByIdService) {
  }

  ngOnChanges(): void {
    if (this.group) {
      this.rootActivityId$.next(this.group.rootActivityId);
    }
  }

}
