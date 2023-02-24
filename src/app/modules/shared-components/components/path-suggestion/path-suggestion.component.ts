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
import { typeCategoryOfItem } from '../../../../shared/helpers/item-type';

const getItemRouteUrl = (item: BreadcrumbsFromRoot, breadcrumbs: BreadcrumbsFromRoot[]): UrlCommand => {
  const path = breadcrumbs.map(item => item.id);
  return urlArrayForItemRoute(itemRoute(typeCategoryOfItem(item), item.id, path));
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
          breadcrumbs.map((item, index) => ({
            ...item,
            url: getItemRouteUrl(item, breadcrumbs.slice(0, index)),
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
