import { Component, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { GetItemPrerequisitesService } from '../../data-access/get-item-prerequisites.service';
import { BehaviorSubject, debounceTime, merge, ReplaySubject, Subject, switchMap } from 'rxjs';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { distinctUntilChanged, filter, map, share, shareReplay } from 'rxjs/operators';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { ItemData } from '../../services/item-datasource.service';
import { canCloseOverlay } from 'src/app/utils/overlay';
import { AddedContent } from 'src/app/ui-components/add-content/add-content.component';
import { ItemType } from 'src/app/items/models/item-type';
import { AddItemPrerequisiteService } from '../../data-access/add-item-prerequisite.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { RemoveItemPrerequisiteService } from '../../data-access/remove-item-prerequisite.service';
import { AddDependencyComponent } from '../add-dependency/add-dependency.component';
import { GetItemDependenciesService } from '../../data-access/get-item-dependencies.service';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from 'src/app/containers/path-suggestion/path-suggestion.component';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { SectionComponent } from 'src/app/ui-components/section/section.component';
import { NgIf, NgFor, AsyncPipe, I18nSelectPipe } from '@angular/common';

@Component({
  selector: 'alg-item-dependencies',
  templateUrl: './item-dependencies.component.html',
  styleUrls: [ './item-dependencies.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    SectionComponent,
    LoadingComponent,
    ErrorComponent,
    NgFor,
    RouterLink,
    ButtonModule,
    AddDependencyComponent,
    OverlayPanelModule,
    PathSuggestionComponent,
    AsyncPipe,
    I18nSelectPipe,
    RawItemRoutePipe,
    RouteUrlPipe,
  ],
})
export class ItemDependenciesComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  @ViewChild('addDependencyComponent') addDependencyComponent?: AddDependencyComponent;
  @ViewChild('op') op?: OverlayPanel;

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.getItemPrerequisitesService.get(itemId)),
    map(items => items.filter(item => item.dependencyGrantContentView)),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );
  dependenciesState$ = this.itemId$.pipe(
    switchMap(itemId => this.getItemDependenciesService.get(itemId)),
    map(items => items.filter(item => item.dependencyGrantContentView)),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );
  addedIds$ = this.state$.pipe(readyData(), map(data => data.map(dependency => dependency.id)));
  private readonly showOverlaySubject$ = new BehaviorSubject<{ event: Event, itemId: string, target: HTMLElement }|undefined>(undefined);
  showOverlay$ = merge(
    this.showOverlaySubject$.pipe(debounceTime(750)),
    this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
  ).pipe(distinctUntilChanged(), shareReplay(1));

  private readonly showOverlaySubscription = this.showOverlay$.subscribe(data => {
    data ? this.op?.toggle(data.event, data.target) : this.op?.hide();
  });

  changeInProgress = false;

  constructor(
    private getItemPrerequisitesService: GetItemPrerequisitesService,
    private addItemPrerequisiteService: AddItemPrerequisiteService,
    private removeItemPrerequisiteService: RemoveItemPrerequisiteService,
    private actionFeedbackService: ActionFeedbackService,
    private getItemDependenciesService: GetItemDependenciesService,
  ) {
  }

  ngOnChanges(): void {
    if (this.itemData) {
      this.itemId$.next(this.itemData.item.id);
    }
  }

  ngOnDestroy(): void {
    this.itemId$.complete();
    this.showOverlaySubject$.complete();
    this.refresh$.complete();
    this.showOverlaySubscription.unsubscribe();
  }

  onMouseEnter(event: Event, itemId: string, targetElement: HTMLAnchorElement): void {
    this.showOverlaySubject$.next({ event, itemId, target: targetElement });
  }

  onMouseLeave(event: MouseEvent): void {
    if (canCloseOverlay(event)) {
      this.closeOverlay();
    }
  }

  closeOverlay(): void {
    this.showOverlaySubject$.next(undefined);
  }

  refresh(): void {
    this.refresh$.next();
  }

  onAdd(item: AddedContent<ItemType>): void {
    if (!item.id) {
      throw new Error('Unexpected: item id is missing');
    }
    const dependentItemId = this.itemData?.item.id;
    if (!dependentItemId) {
      throw new Error('Unexpected: dependent item id is missing');
    }
    this.changeInProgress = true;
    this.addItemPrerequisiteService.create(dependentItemId, item.id).subscribe({
      next: () => {
        this.changeInProgress = false;
        this.actionFeedbackService.success('The new dependency has been added');
        this.addDependencyComponent?.addContentComponent?.reset();
        this.refresh();
      },
      error: err => {
        this.changeInProgress = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

  onRemove(id: string): void {
    const dependentItemId = this.itemData?.item.id;
    if (!dependentItemId) {
      throw new Error('Unexpected: Missed dependent item id');
    }
    this.changeInProgress = true;
    this.removeItemPrerequisiteService.delete(dependentItemId, id).subscribe({
      next: () => {
        this.changeInProgress = false;
        this.actionFeedbackService.success('The dependency has been removed');
        this.refresh();
      },
      error: err => {
        this.changeInProgress = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }
}
