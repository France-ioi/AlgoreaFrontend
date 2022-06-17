import { Component, Input, ViewChild } from '@angular/core';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import {
  ChildDataWithId,
  hasId,
  ItemChildrenEditComponent,
  PossiblyInvisibleChildData
} from '../item-children-edit/item-children-edit.component';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { CreateItemService, NewItem } from '../../http-services/create-item.service';
import { map, switchMap } from 'rxjs/operators';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ItemChanges, UpdateItemService } from '../../http-services/update-item.service';

@Component({
  selector: 'alg-item-children-edit-form',
  templateUrl: './item-children-edit-form.component.html',
  styleUrls: [ './item-children-edit-form.component.scss' ],
})
export class ItemChildrenEditFormComponent {
  @Input() itemData?: ItemData;

  @ViewChild('childrenEdit') private childrenEdit?: ItemChildrenEditComponent;

  disabled = false;
  dirty = false;
  itemChanges: { children?: PossiblyInvisibleChildData[] } = {};

  constructor(
    private createItemService: CreateItemService,
    private updateItemService: UpdateItemService,
    private itemDataSource: ItemDataSource,
    private actionFeedbackService: ActionFeedbackService,
  ) {}

  updateItemChanges(children: PossiblyInvisibleChildData[]): void {
    this.dirty = true;
    this.itemChanges.children = children;
  }

  private createChildren(): Observable<ChildDataWithId[] | undefined> {
    if (!this.itemChanges.children) return of(undefined);

    if (this.itemChanges.children.length === 0) {
      return of([]);
    }

    return forkJoin(
      this.itemChanges.children.map(child => {
        if (!this.itemData) return throwError(new Error('Missed item data'));
        if (hasId(child) || !child.isVisible) return of(child);
        // the child doesn't have an id, so we create it
        if (!child.title) return throwError(new Error('Something went wrong, the new child is missing his title'));
        const newChild: NewItem = {
          title: child.title,
          type: child.type,
          languageTag: 'en',
          parent: this.itemData.item.id,
        };
        return this.createItemService
          .create(newChild)
          .pipe(map(res => ({ id: res, ...child })));
      })
    );
  }

  private updateItem(): Observable<void> {
    return this.createChildren().pipe(
      switchMap(children => {
        if (!this.itemData) return throwError(new Error('Invalid initial data'));
        if (!children) return throwError(new Error('Unexpected: Children list are empty'));
        const changes: ItemChanges = { children: [] };
        // @TODO: Avoid affecting component vars in Observable Operator
        // save the new children (their ids) to prevent recreating them in case of error
        this.itemChanges.children = children;
        changes.children = children.map((child, idx) => ({
          item_id: child.id,
          order: idx,
          score_weight: child.scoreWeight,
          content_view_propagation: child.contentViewPropagation,
          edit_propagation: child.editPropagation,
          grant_view_propagation: child.grantViewPropagation,
          upper_view_levels_propagation: child.upperViewLevelsPropagation,
          watch_propagation: child.watchPropagation,
        }));
        if (!Object.keys(changes).length) return of(undefined);
        return this.updateItemService.updateItem(this.itemData.item.id, changes);
      }),
    );
  }

  save(): void {
    this.disabled = true;
    this.updateItem().subscribe({
      next: _status => {
        this.actionFeedbackService.success($localize`Changes successfully saved.`);
        this.itemDataSource.refreshItem(); // which will re-enable the form
      },
      error: err => {
        this.disabled = false;
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }

  onCancel(): void {
    this.itemChanges = {};
    this.disabled = false;
    this.dirty = false;
    this.childrenEdit?.reset();
  }
}
