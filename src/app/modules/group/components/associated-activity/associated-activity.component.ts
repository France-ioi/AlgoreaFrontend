import { Component, forwardRef } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { catchError, distinct, map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { incompleteItemStringUrl } from 'src/app/shared/routing/item-route';
import { SearchItemService } from 'src/app/modules/item/http-services/search-item.service';
import { AddedContent } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { ActivityType } from 'src/app/shared/helpers/item-type';
import { allowedNewActivityTypes } from 'src/app/shared/helpers/new-item-types';
import { NoActivity, NewActivity, ExistingActivity, isActivityFound, isExistingActivity, isNewActivity } from './associated-activity-types';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { ControlValueAccessor } from '@ngneat/reactive-forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

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
export class AssociatedActivityComponent implements ControlValueAccessor<NoActivity|NewActivity|ExistingActivity> {

  readonly allowedNewItemTypes = allowedNewActivityTypes;

  private readonly activityChanges$ = new ReplaySubject<{
    activity: NoActivity|NewActivity|(ExistingActivity&{ name?: string }),
    triggerChange: boolean,
  }>();

  readonly state$ = this.activityChanges$.pipe(
    distinct(),
    switchMap(data => {
      if (data.triggerChange) this.onChange(data.activity);

      if (!isExistingActivity(data.activity)) {
        return of({
          tag: data.activity.tag, id: undefined, path: null,
          name: isNewActivity(data.activity) ? data.activity.name : undefined
        });
      }

      const id = data.activity.id;
      const name = data.activity.name !== undefined ? of(data.activity.name) :
        this.getItemByIdService.get(id).pipe(map(item => item.string.title));

      return name.pipe(
        map(name => ({ tag: 'existing-activity', id: id, name, path: incompleteItemStringUrl(id, 'activity') })),
        catchError(err => {
          if (errorIsHTTPForbidden(err)) return of({
            tag: 'existing-activity', name: $localize`You don't have access to this activity.`, path: null
          });
          throw err;
        })
      );
    }),
    mapToFetchState(),
  );

  onChange: (value: NoActivity|NewActivity|ExistingActivity|null) => void = () => {};

  searchFunction = (value: string): Observable<AddedContent<ActivityType>[]> =>
    this.searchItemService.search(value, [ 'Chapter', 'Course', 'Task' ])
      .pipe(map(items => items.filter(isActivityFound)));

  constructor(
    private getItemByIdService: GetItemByIdService,
    private searchItemService: SearchItemService,
  ) { }

  writeValue(rootActivity: NoActivity|NewActivity|ExistingActivity): void {
    this.activityChanges$.next({ activity: rootActivity, triggerChange: false });
  }

  registerOnChange(fn: (value: NoActivity|NewActivity|ExistingActivity|null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {
  }

  onRemove(): void {
    this.activityChanges$.next({
      activity: { tag: 'no-activity' }, triggerChange: true });
  }

  setRootActivity(activity: AddedContent<ActivityType>): void {
    this.activityChanges$.next({
      activity: activity.id !== undefined ?
        { tag: 'existing-activity', id: activity.id, name: activity.title } :
        { tag: 'new-activity', name: activity.title, activityType: activity.type },
      triggerChange: true
    });
  }
}
