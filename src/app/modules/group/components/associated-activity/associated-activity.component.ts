import { Component, forwardRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { merge, of } from 'rxjs';
import { Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { incompleteItemStringUrl } from 'src/app/shared/helpers/item-route';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';

type ActivityId = string;

@Component({
  selector: 'alg-associated-activity',
  templateUrl: './associated-activity.component.html',
  styleUrls: [ './associated-activity.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AssociatedActivityComponent),
      multi: true,
    }
  ]
})
export class AssociatedActivityComponent implements OnDestroy, ControlValueAccessor {

  rootActivity: null|{
    id: ActivityId,
    name: string|null,
    path: string,
  } = null;

  state: 'fetching'|'ready'|'error' = 'fetching';

  private activityFetching = new Subject<ActivityId|null>();

  private onChange: (value: ActivityId|null) => void = () => {};

  constructor(
    private getItemByIdService: GetItemByIdService,
  ) {
    this.activityFetching.pipe(
      switchMap(activityId => {
        if (activityId === null) return of(readyState(null));
        return merge(
          of(fetchingState()),
          this.getItemByIdService.get(activityId).pipe(map(item => readyState({
            id: activityId,
            name: item.string.title,
            path: incompleteItemStringUrl(activityId)
          }))),
        );
      })
    ).subscribe(state => {
      this.state = state.tag;
      if (isReady(state)) {
        this.rootActivity = state.data;
      }
    });
  }

  ngOnDestroy(): void {
    this.activityFetching.complete();
  }

  writeValue(rootActivityId: ActivityId|null): void {
    this.activityFetching.next(rootActivityId);
  }

  registerOnChange(fn: (value: ActivityId|null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {
  }

  onRemove(): void {
    if (this.rootActivity === null || this.state !== 'ready') return;

    this.rootActivity = null;
    this.onChange(null);
  }
}
