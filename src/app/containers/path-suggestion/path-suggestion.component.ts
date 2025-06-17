import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import {
  BreadcrumbsFromRootElement,
  GetBreadcrumbsFromRootsService
} from '../../data-access/get-breadcrumbs-from-roots.service';
import { ReplaySubject, Subject, switchMap } from 'rxjs';
import { mapToFetchState } from '../../utils/operators/state';
import { map } from 'rxjs/operators';
import { itemRoute } from '../../models/routing/item-route';
import { UrlCommand } from '../../utils/url';
import { typeCategoryOfItem } from '../../items/models/item-type';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { itemRouteAsUrlCommand } from 'src/app/models/routing/item-route-serialization';
import { APPCONFIG, AppConfig } from 'src/app/config';

@Component({
  selector: 'alg-path-suggestion',
  templateUrl: './path-suggestion.component.html',
  styleUrls: [ './path-suggestion.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    NgFor,
    RouterLink,
    AsyncPipe,
  ],
})
export class PathSuggestionComponent implements AfterViewInit, OnDestroy, OnChanges {
  private config: AppConfig = inject(APPCONFIG);

  private getItemRouteUrl(item: BreadcrumbsFromRootElement, breadcrumbs: BreadcrumbsFromRootElement[]): UrlCommand {
    const path = breadcrumbs.map(brItem => brItem.id);
    return itemRouteAsUrlCommand(itemRoute(typeCategoryOfItem(item), item.id, { path }), this.config.redirects);
  }

  @Output() resize = new EventEmitter<void>();
  @Input() itemId?: string;

  resizeObserver = new ResizeObserver(() =>
    this.resize.emit()
  );

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.getBreadcrumbsFromRootsService.get(itemId).pipe(
      map(group => (group.length > 0 ? group.map(breadcrumbs =>
        breadcrumbs.map((item, index) => ({
          ...item,
          url: this.getItemRouteUrl(item, breadcrumbs.slice(0, index)),
        }))
      ).filter(group => group.length > 0) : undefined)),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(private getBreadcrumbsFromRootsService: GetBreadcrumbsFromRootsService, private elementRef: ElementRef<HTMLDivElement>) {
  }

  ngAfterViewInit(): void {
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnChanges(): void {
    if (this.itemId) {
      this.itemId$.next(this.itemId);
    }
  }

  ngOnDestroy(): void {
    this.itemId$.complete();
    this.refresh$.complete();
    this.resizeObserver.unobserve(this.elementRef.nativeElement);
  }

  refresh(): void {
    this.refresh$.next();
  }
}
