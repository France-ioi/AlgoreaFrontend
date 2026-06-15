import { Component, DestroyRef, input, signal, viewChild, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { GetItemPrerequisitesService } from '../../data-access/get-item-prerequisites.service';
import { Subject, switchMap } from 'rxjs';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { map, share } from 'rxjs/operators';
import { ItemData } from '../../models/item-data';
import { AddedContent } from 'src/app/ui-components/add-content/add-content.component';
import { ItemType } from 'src/app/items/models/item-type';
import { AddItemPrerequisiteService } from '../../data-access/add-item-prerequisite.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { RemoveItemPrerequisiteService } from '../../data-access/remove-item-prerequisite.service';
import { AddDependencyComponent } from '../add-dependency/add-dependency.component';
import { GetItemDependenciesService } from '../../data-access/get-item-dependencies.service';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from 'src/app/containers/path-suggestion/path-suggestion.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { ShowOverlayDirective } from 'src/app/ui-components/overlay/show-overlay.directive';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-item-dependencies',
  templateUrl: './item-dependencies.component.html',
  styleUrls: [ './item-dependencies.component.scss' ],
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    AddDependencyComponent,
    PathSuggestionComponent,
    AsyncPipe,
    ItemRoutePipe,
    RouteUrlPipe,
    ShowOverlayDirective,
    ShowOverlayHoverTargetDirective,
    ButtonIconComponent,
  ]
})
export class ItemDependenciesComponent {
  private getItemPrerequisitesService = inject(GetItemPrerequisitesService);
  private addItemPrerequisiteService = inject(AddItemPrerequisiteService);
  private removeItemPrerequisiteService = inject(RemoveItemPrerequisiteService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private getItemDependenciesService = inject(GetItemDependenciesService);
  private readonly destroyRef = inject(DestroyRef);

  itemData = input.required<ItemData>();

  addDependencyComponent = viewChild('addDependencyComponent', { read: AddDependencyComponent });

  private readonly refresh$ = new Subject<void>();

  private readonly itemId$ = toObservable(this.itemData).pipe(map(itemData => itemData.item.id));

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

  changeInProgress = signal(false);
  itemId = signal<string | undefined>(undefined);

  constructor() {
    this.destroyRef.onDestroy(() => this.refresh$.complete());
  }

  refresh(): void {
    this.refresh$.next();
  }

  onAdd(item: AddedContent<ItemType>): void {
    if (!item.id) {
      throw new Error('Unexpected: item id is missing');
    }
    const dependentItemId = this.itemData().item.id;
    this.changeInProgress.set(true);
    this.addItemPrerequisiteService.create(dependentItemId, item.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.changeInProgress.set(false);
        this.actionFeedbackService.success('The new dependency has been added');
        this.addDependencyComponent()?.addContentComponent()?.reset();
        this.refresh();
      },
      error: err => {
        this.changeInProgress.set(false);
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }

  onRemove(id: string): void {
    const dependentItemId = this.itemData().item.id;
    this.changeInProgress.set(true);
    this.removeItemPrerequisiteService.delete(dependentItemId, id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.changeInProgress.set(false);
        this.actionFeedbackService.success('The dependency has been removed');
        this.refresh();
      },
      error: err => {
        this.changeInProgress.set(false);
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }
}
