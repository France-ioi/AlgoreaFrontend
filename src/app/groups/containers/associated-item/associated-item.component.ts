import { Component, computed, forwardRef, input, OnDestroy, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { itemRoute, urlArrayForItemRoute } from 'src/app/models/routing/item-route';
import { SearchItemService } from 'src/app/data-access/search-item.service';
import { AddedContent } from 'src/app/ui-components/add-content/add-content.component';
import { isSkill, ItemType, ItemTypeCategory } from 'src/app/items/models/item-type';
import {
  NoAssociatedItem,
  NewAssociatedItem,
  ExistingAssociatedItem,
  isExistingAssociatedItem,
  isNewAssociatedItem,
  noAssociatedItem,
} from './associated-item-types';
import { errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/utils/errors';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { getAllowedNewItemTypes } from 'src/app/items/models/new-item-types';
import { RouterLink } from '@angular/router';
import { AddContentComponent } from 'src/app/ui-components/add-content/add-content.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, NgSwitch, NgSwitchCase, NgClass, AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageInfoComponent } from 'src/app/ui-components/message-info/message-info.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { AllowsViewingItemInfoPipe } from 'src/app/items/models/item-view-permission';
import { AllowsGrantingViewItemPipe } from 'src/app/items/models/item-grant-view-permission';
import { AllowsWatchingItemResultsPipe } from 'src/app/items/models/item-watch-permission';
import { Store } from '@ngrx/store';
import { Group } from '../../data-access/get-group-by-id.service';

@Component({
  selector: 'alg-associated-item',
  templateUrl: './associated-item.component.html',
  styleUrls: [ './associated-item.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AssociatedItemComponent),
      multi: true,
    }
  ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    NgSwitch,
    NgSwitchCase,
    AddContentComponent,
    RouterLink,
    NgClass,
    AsyncPipe,
    ButtonModule,
    NgTemplateOutlet,
    MessageInfoComponent,
    AllowsViewingItemInfoPipe,
    AllowsGrantingViewItemPipe,
    AllowsWatchingItemResultsPipe,
  ],
})
export class AssociatedItemComponent implements ControlValueAccessor, OnDestroy {

  group = input.required<Group>();
  contentType = input.required<ItemTypeCategory>();
  /**
   * Whether this component is for the associated skill (or associated activity)
   */
  isSkill = computed(() => isSkill(this.contentType()));

  /**
   * The list of allowed item types with icons etc for the new content case
   */
  allowedNewItemTypes = computed(() => getAllowedNewItemTypes({ allowActivities: !this.isSkill(), allowSkills: this.isSkill() }));

  private associatedItem = signal<NoAssociatedItem|NewAssociatedItem|(ExistingAssociatedItem&{ name?: string })>(noAssociatedItem);

  private refresh$ = new Subject<void>();

  readonly state$ = toObservable(this.associatedItem).pipe(
    switchMap(item => {

      if (!isExistingAssociatedItem(item)) {
        return of({
          tag: item.tag, id: undefined, path: null,
          name: isNewAssociatedItem(item) ? item.name : undefined,
          permissions: undefined,
        });
      }

      const id = item.id;

      /** to be fixed
      if (item.name !== undefined) {
        return of({
          tag: 'existing-item',
          id,
          permissions: undefined,
          name: item.name,
          path: urlArrayForItemRoute(itemRoute(this.contentType(), id))
        });
      }*/

      return this.getItemByIdService.get(id, this.group().id).pipe(
        map(item => ({
          tag: 'existing-item',
          id,
          name: item.string.title,
          permissions: item.watchedGroup ? {
            item: item.permissions,
            group: item.watchedGroup.permissions,
          } : undefined,
          path: urlArrayForItemRoute(itemRoute(this.contentType(), id))
        })),
        catchError(err => {
          if (errorIsHTTPForbidden(err)) return of({
            tag: 'existing-item',
            name: $localize`You don't have access to this ` + (this.contentType() === 'activity'
              ? $localize`activity` : $localize`skill`) + '.',
            permissions: undefined,
            path: null,
          });
          else if (errorIsHTTPNotFound(err)) return of({
            tag: 'existing-item',
            name: $localize`The configured ` + (this.contentType() === 'activity'
              ? $localize`activity` : $localize`skill`) + $localize` is currently not visible to you.`,
            permissions: undefined,
            path: null,
          });
          throw err;
        })
      );
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  private onChange: (value: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem) => void = () => {};

  searchFunction = (value: string): Observable<AddedContent<ItemType>[]> =>
    this.searchItemService.search(value, this.contentType() === 'activity' ? [ 'Chapter', 'Task' ] : [ 'Skill' ]);

  constructor(
    private getItemByIdService: GetItemByIdService,
    private searchItemService: SearchItemService,
  ) { }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  writeValue(associatedItem: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem): void {
    this.associatedItem.set(associatedItem);
  }

  registerOnChange(fn: (value: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {
  }

  onRemove(): void {
    this.associatedItem.set(noAssociatedItem);
    this.onChange(noAssociatedItem);
  }

  setAssociatedItem(item: AddedContent<ItemType>): void {
    const newValue = item.id !== undefined ?
      { tag: 'existing-item', id: item.id, name: item.title } :
      { tag: 'new-item', name: item.title, url: item.url, itemType: item.type };
    this.associatedItem.set(newValue);
    this.onChange(newValue);
  }

  refresh(): void {
    this.refresh$.next();
  }
}
