import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetItemByIdService } from '../../../item/http-services/get-item-by-id.service';
import { ReplaySubject, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';

@Component({
  selector: 'alg-group-access',
  templateUrl: './group-access.component.html',
  styleUrls: [ './group-access.component.scss' ],
})
export class GroupAccessComponent implements OnChanges, OnDestroy {
  @Input() group?: Group;

  private readonly rootActivityId$ = new ReplaySubject<string | null>(1);

  private refresh$ = new Subject<void>();
  rootActivityState$ = this.rootActivityId$.pipe(
    switchMap(rootActivityId => {
      if (!rootActivityId) {
        return of(null);
      }
      return this.getItemByIdService.get(rootActivityId);
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(private getItemByIdService: GetItemByIdService) {
  }

  ngOnChanges(): void {
    if (this.group) {
      this.rootActivityId$.next(this.group.rootActivityId);
    }
  }

  ngOnDestroy(): void {
    this.rootActivityId$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

}
