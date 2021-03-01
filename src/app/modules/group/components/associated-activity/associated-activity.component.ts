import { Component, forwardRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { merge, of } from 'rxjs';
import { Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { incompleteItemStringUrl } from 'src/app/shared/routing/item-route';
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

  private activityChanges = new Subject<{id: ActivityId|null, triggerChange: boolean}>();

  private onChange: (value: ActivityId|null) => void = () => {};

  constructor(
    private getItemByIdService: GetItemByIdService,
  ) {
    this.activityChanges.pipe(
      switchMap(data => {
        const id = data.id;
        if (id === null) return of(readyState({ activity: null, triggerChange: data.triggerChange }));
        return merge(
          of(fetchingState()),
          this.getItemByIdService.get(id).pipe(map(item => readyState({
            triggerChange: data.triggerChange,
            activity: {
              id: id,
              name: item.string.title,
              path: incompleteItemStringUrl(id)
            }
          }))),
        );
      })
    ).subscribe(state => {
      this.state = state.tag;
      if (isReady(state)) {
        this.rootActivity = state.data.activity;
        if (state.data.triggerChange) this.onChange(this.rootActivity === null ? null : this.rootActivity.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.activityChanges.complete();
  }

  writeValue(rootActivityId: ActivityId|null): void {
    this.activityChanges.next({ id: rootActivityId, triggerChange: false });
  }

  registerOnChange(fn: (value: ActivityId|null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {
  }

  onRemove(): void {
    if (this.rootActivity === null || this.state !== 'ready') throw new Error('Unexpected: tried to remove root activity when not ready');
    this.activityChanges.next({ id: null, triggerChange: true });
  }
}
