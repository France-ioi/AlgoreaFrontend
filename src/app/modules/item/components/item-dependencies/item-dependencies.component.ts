import { Component, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { GetItemPrerequisitesService } from '../../http-services/get-item-prerequisites.service';
import { BehaviorSubject, debounceTime, merge, ReplaySubject, Subject, switchMap } from 'rxjs';
import { mapToFetchState, readyData } from '../../../../shared/operators/state';
import { distinctUntilChanged, filter, map, share, shareReplay } from 'rxjs/operators';
import { OverlayPanel } from 'primeng/overlaypanel';
import { ItemData } from '../../services/item-datasource.service';
import { canCloseOverlay } from '../../../../shared/helpers/overlay';
import { AddedContent } from '../../../shared-components/components/add-content/add-content.component';
import { ItemType } from '../../../../shared/helpers/item-type';
import { AddItemPrerequisiteService } from '../../http-services/add-item-prerequisite.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { RemoveItemPrerequisiteService } from '../../http-services/remove-item-prerequisite.service';
import { AddDependencyComponent } from '../add-dependency/add-dependency.component';
import { GetItemDependenciesService } from '../../http-services/get-item-dependencies.service';

@Component({
  selector: 'alg-item-dependencies',
  templateUrl: './item-dependencies.component.html',
  styleUrls: [ './item-dependencies.component.scss' ],
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
