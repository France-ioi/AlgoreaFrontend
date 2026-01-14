import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { GetBreadcrumbsFromRootsService } from '../../data-access/get-breadcrumbs-from-roots.service';
import { ReplaySubject, Subject, switchMap } from 'rxjs';
import { mapToFetchState } from '../../utils/operators/state';
import { map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { mapBreadcrumbsWithPath } from 'src/app/models/content/content-breadcrumbs';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';

@Component({
  selector: 'alg-path-suggestion',
  templateUrl: './path-suggestion.component.html',
  styleUrls: [ './path-suggestion.component.scss' ],
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    AsyncPipe,
    ItemRoutePipe,
    RouteUrlPipe,
  ]
})
export class PathSuggestionComponent implements AfterViewInit, OnDestroy, OnChanges {

  @Output() resize = new EventEmitter<void>();
  @Input() itemId?: string;

  resizeObserver = new ResizeObserver(() =>
    this.resize.emit()
  );

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.getBreadcrumbsFromRootsService.get(itemId).pipe(
      map(breadcrumbsList => breadcrumbsList.map(mapBreadcrumbsWithPath)),
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
