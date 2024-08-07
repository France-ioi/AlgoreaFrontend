import { Injectable, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { UserSessionService } from 'src/app/services/user-session.service';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { Item } from '../../data-access/get-item-by-id.service';
import { Result } from '../data-access/get-results.service';
import { Store } from '@ngrx/store';
import { fromItemContent } from '../store';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

export interface ItemData {
  route: FullItemRoute,
  item: Item,
  breadcrumbs: BreadcrumbItem[],
  results?: Result[],
  currentResult?: Result,
}

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

  private subscription = combineLatest([
    this.userSessionService.userChanged$, // user change
    this.userSessionService.userProfile$.pipe(map(user => user.defaultLanguage), distinctUntilChanged()), // lang change
  ]).pipe(debounceTime(0)).subscribe(_s => this.refreshItem());

  constructor(
    private store: Store,
    private userSessionService: UserSessionService,
  ) {}

  refreshItem(): void {
    this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

}
