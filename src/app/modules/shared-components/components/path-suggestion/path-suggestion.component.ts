import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import {
  BreadcrumbsFromRoot,
  GetBreadcrumbsFromRootsService
} from '../../../item/http-services/get-breadcrumbs-from-roots.service';
import { ReplaySubject, Subject, switchMap } from 'rxjs';
import { mapToFetchState } from '../../../../shared/operators/state';
import { map } from 'rxjs/operators';
import { itemRoute } from '../../../../shared/routing/item-route';
import { ItemRouter } from '../../../../shared/routing/item-router';

@Component({
  selector: 'alg-path-suggestion',
  templateUrl: './path-suggestion.component.html',
  styleUrls: [ './path-suggestion.component.scss' ],
})
export class PathSuggestionComponent implements OnDestroy, OnChanges {
  @Input() itemId?: string;

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.getBreadcrumbsFromRootsService.get(itemId).pipe(
      map(group => {
        if (group.length === 0) {
          return undefined;
        }

        const allBreadcrumbs = group
          .map(items => items.slice(0, items.length - 1))
          .reduce((state, items) => [ ...state, ...items ], []);

        if (allBreadcrumbs.length === 0) {
          return [];
        }

        return group.map(items => items.slice(0, items.length - 1)).filter(items => items.length > 0);
      }),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(private getBreadcrumbsFromRootsService: GetBreadcrumbsFromRootsService, private itemRouter: ItemRouter) {
  }

  ngOnChanges(): void {
    if (this.itemId) {
      this.itemId$.next(this.itemId);
    }
  }

  ngOnDestroy(): void {
    this.itemId$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

  navigateToItem(id: string, breadcrumbs: BreadcrumbsFromRoot[], index: number): void {
    const path = breadcrumbs.slice(0, index).map(item => item.id);
    this.itemRouter.navigateTo(itemRoute('activity', id, path));
  }
}
