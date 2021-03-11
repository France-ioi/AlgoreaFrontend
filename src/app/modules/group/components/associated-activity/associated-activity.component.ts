import { Component, forwardRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { merge, Observable, of } from 'rxjs';
import { Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { incompleteItemStringUrl } from 'src/app/shared/routing/item-route';

type ActivityId = string;
import { SearchItemService } from 'src/app/modules/item/http-services/search-item.service';
import { AddedContent } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { ActivityType, ItemType } from 'src/app/shared/helpers/item-type';
import { allowedNewActivityTypes } from 'src/app/shared/helpers/new-item-types';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';
import { NoActivity, NewActivity, ExistingActivity, isExistingActivity, isNewActivity } from './associated-activity-types';

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

  rootActivity: NoActivity|NewActivity|ExistingActivity = { tag: 'no-activity' };
  rootActivityData: null|{name: string|null, path: string|null} = null;

  state: 'fetching'|'ready'|'error' = 'fetching';

  readonly allowedNewItemTypes = allowedNewActivityTypes;

  private activityChanges = new Subject<{activity: NoActivity|NewActivity|ExistingActivity, triggerChange: boolean}>();

  private onChange: (value: NoActivity|NewActivity|ExistingActivity) => void = () => {};

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(value, [ 'Chapter', 'Course', 'Task' ]);

  constructor(
    private getItemByIdService: GetItemByIdService,
    private searchItemService: SearchItemService,
  ) {
    this.activityChanges.pipe(
      switchMap(data => {
        if (!isExistingActivity(data.activity)) {
          return of(readyState({
            activity: data.activity,
            activityData: isNewActivity(data.activity) ? { name: data.activity.name, path: null } : null,
            triggerChange: data.triggerChange
          }));
        }

        const id = data.activity.id;

        return merge(
          of(fetchingState()),
          this.getItemByIdService.get(id).pipe(map(item => readyState({
            triggerChange: data.triggerChange,
            activity: { tag: 'existing-activity', id: id } as ExistingActivity,
            activityData: { name: item.string.title, path: incompleteItemStringUrl(id) },
          }))),
        );
      })
    ).subscribe(state => {
      this.state = state.tag;
      if (state.isReady) {
        this.rootActivity = state.data.activity;
        this.rootActivityData = state.data.activityData;
        if (state.data.triggerChange) this.onChange(this.rootActivity);
      }
    });
  }

  ngOnDestroy(): void {
    this.activityChanges.complete();
  }

  writeValue(rootActivity: NoActivity|NewActivity|ExistingActivity): void {
    this.activityChanges.next({ activity: rootActivity, triggerChange: false });
  }

  registerOnChange(fn: (value: NoActivity|NewActivity|ExistingActivity) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {
  }

  onRemove(): void {
    if (this.rootActivity.tag === 'no-activity' || this.state !== 'ready') {
      throw new Error('Unexpected: tried to remove root activity when not ready or no prior activity');
    }

    this.activityChanges.next({ activity: { tag: 'no-activity' }, triggerChange: true });
  }

  setRootActivity(activity: AddedContent<ActivityType>): void {
    if (this.rootActivity.tag !== 'no-activity' || this.state !== 'ready') {
      throw new Error('Unexpected: tried to set a root activty when not ready or already set activity');
    }

    if (activity.id !== undefined) {
      this.activityChanges.next({ activity: { tag: 'existing-activity', id: activity.id }, triggerChange: true });
    } else {
      this.activityChanges.next({
        activity: { tag: 'new-activity', name: activity.title, activityType: activity.type },
        triggerChange: true
      });
    }
  }
}
