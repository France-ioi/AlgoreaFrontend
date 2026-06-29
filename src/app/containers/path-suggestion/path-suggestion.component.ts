import {
  AfterViewInit, Component, ElementRef, inject, input, OnDestroy, output,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { GetBreadcrumbsFromRootsService } from '../../data-access/get-breadcrumbs-from-roots.service';
import { Subject, switchMap } from 'rxjs';
import { mapToFetchState } from '../../utils/operators/state';
import { filter, map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { mapBreadcrumbsWithPath } from 'src/app/models/content/content-breadcrumbs';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { IsHttpForbiddenPipe } from 'src/app/utils/error-handling/http-error.pipes';

@Component({
  selector: 'alg-path-suggestion',
  templateUrl: './path-suggestion.component.html',
  styleUrl: './path-suggestion.component.scss',
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    AsyncPipe,
    ItemRoutePipe,
    RouteUrlPipe,
    IsHttpForbiddenPipe,
  ]
})
export class PathSuggestionComponent implements AfterViewInit, OnDestroy {
  private getBreadcrumbsFromRootsService = inject(GetBreadcrumbsFromRootsService);
  private elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);

  itemId = input<string>();
  resize = output<void>();

  resizeObserver = new ResizeObserver(() =>
    this.resize.emit()
  );

  private readonly itemId$ = toObservable(this.itemId).pipe(filter((id): id is string => !!id));
  private readonly refresh$ = new Subject<void>();

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.getBreadcrumbsFromRootsService.get(itemId).pipe(
      map(breadcrumbsList => breadcrumbsList.map(mapBreadcrumbsWithPath)),
    )),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  ngAfterViewInit(): void {
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.resizeObserver.unobserve(this.elementRef.nativeElement);
  }

  refresh(): void {
    this.refresh$.next();
  }
}
