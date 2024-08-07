import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { fromItemContent } from '../store';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

/**
 * A datasource which allows fetching a item using a proper state and sharing it among several components.
 * The only interactions with this class are:
 * - trigger actions by calling public functions
 * - listen state change by listening the state
 */
@Injectable()
export class ItemDataSource implements OnDestroy {

  private readonly destroyed$ = new Subject<void>();

  /* state to put outputted */
  readonly state$ = this.store.select(fromItemContent.selectActiveContentData).pipe(
    filter(isNotNull),
  );

  constructor(
    private store: Store,
  ) {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

}
