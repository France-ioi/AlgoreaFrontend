import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import {
  BreadcrumbsFromRoot,
  GetBreadcrumbsFromRootsService
} from '../../../item/http-services/get-breadcrumbs-from-roots.service';
import { ReplaySubject, Subject, switchMap } from 'rxjs';
import { mapToFetchState } from '../../../../shared/operators/state';
import { map } from 'rxjs/operators';
import { itemRoute, urlArrayForItemRoute } from '../../../../shared/routing/item-route';
import { UrlCommand } from '../../../../shared/helpers/url';

const getItemRouteUrl = (id: string, breadcrumbs: BreadcrumbsFromRoot[]): UrlCommand => {
  const index = breadcrumbs.findIndex(item => item.id === id);
  const path = breadcrumbs.slice(0, index).map(item => item.id);
  return urlArrayForItemRoute(itemRoute('activity', id, path));
};

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
      map(group =>
        (group.length > 0 ? group.map(breadcrumbs =>
          breadcrumbs.slice(0, breadcrumbs.length - 1).map(item => ({
            ...item,
            url: getItemRouteUrl(item.id, breadcrumbs),
          }))
        ).filter(group => group.length > 0) : undefined)
      ),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(private getBreadcrumbsFromRootsService: GetBreadcrumbsFromRootsService) {
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
}
