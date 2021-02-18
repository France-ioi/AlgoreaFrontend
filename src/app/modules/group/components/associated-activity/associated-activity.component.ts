import { Component, forwardRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Router } from '@angular/router';
import { merge, of } from 'rxjs';
import { Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { fetchingState, isReady, readyState } from 'src/app/shared/helpers/state';

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

  rootActivityId: string|null = null;
  rootActivityName: string|null = null;

  state: 'fetching'|'ready'|'error' = 'fetching';

  private activityFetching = new Subject<string|null>();

  private onChange: (value: string|null) => void = () => {};

  constructor(
    private getItemByIdService: GetItemByIdService,
    private router: Router,
  ) {
    this.activityFetching.pipe(
      switchMap(activityId => {
        if (activityId === null) return of(readyState({ id: null, name: null }));
        return merge(
          of(fetchingState()),
          this.getItemByIdService.get(activityId).pipe(map(item => readyState({ id: activityId, name: item.string.title }))),
        );
      })
    ).subscribe(state => {
      this.state = state.tag;
      if (isReady(state)) {
        this.rootActivityId = state.data.id;
        this.rootActivityName = state.data.name;
        this.onChange(this.rootActivityId);
      }
    });
  }

  ngOnDestroy(): void {
    this.activityFetching.complete();
  }

  writeValue(rootActivityId: string|null): void {
    this.activityFetching.next(rootActivityId);
  }

  registerOnChange(fn: (value: string|null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {
  }

  onClickActivity(): void {
    if (this.rootActivityId === null) return;

    void this.router.navigate([ 'items', 'by-id', this.rootActivityId ]);
  }

  onRemove(): void {
    if (this.rootActivityId === null) return;

    this.rootActivityId = null;
    this.rootActivityName = null;
    this.onChange(this.rootActivityId);
  }
}
