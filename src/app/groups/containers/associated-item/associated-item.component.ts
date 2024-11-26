import { Component, computed, forwardRef, input, OnDestroy, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { SearchItemService } from 'src/app/data-access/search-item.service';
import { AddedContent } from 'src/app/ui-components/add-content/add-content.component';
import { isSkill, ItemType, ItemTypeCategory } from 'src/app/items/models/item-type';
import {
  NoAssociatedItem,
  NewAssociatedItem,
  ExistingAssociatedItem,
  isExistingAssociatedItem,
  noAssociatedItem,
} from './associated-item-types';
import { errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/utils/errors';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { getAllowedNewItemTypes } from 'src/app/items/models/new-item-types';
import { RouterLink } from '@angular/router';
import { AddContentComponent } from 'src/app/ui-components/add-content/add-content.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, NgSwitch, NgSwitchCase, NgTemplateOutlet } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageInfoComponent } from 'src/app/ui-components/message-info/message-info.component';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AllowsViewingItemInfoPipe } from 'src/app/items/models/item-view-permission';
import { AllowsGrantingViewItemPipe } from 'src/app/items/models/item-grant-view-permission';
import { Group } from '../../data-access/get-group-by-id.service';
import { canCurrentUserViewGroupPermissions, CanCurrentUserViewGroupPermissionsPipe } from '../../models/group-management';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';

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
    ButtonModule,
    NgTemplateOutlet,
    MessageInfoComponent,
    AllowsViewingItemInfoPipe,
    AllowsGrantingViewItemPipe,
    CanCurrentUserViewGroupPermissionsPipe,
    ItemRoutePipe,
    RouteUrlPipe,
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

  associatedItem = signal<NoAssociatedItem|NewAssociatedItem|(ExistingAssociatedItem&{ name?: string })>(noAssociatedItem);

  private refresh$ = new Subject<void>();

  private existingItemState$ = toObservable(this.associatedItem).pipe(
    filter((item): item is ExistingAssociatedItem & { name?: string } => isExistingAssociatedItem(item)),
    switchMap(item => {
      const id = item.id;
      const canViewGroupPerms = canCurrentUserViewGroupPermissions(this.group());
      // the only scenario where it is not needed to fetching the item info
      if (!canViewGroupPerms && item.name) {
        return of({ id, name: item.name, groupPerms: undefined, permissions: undefined, contentType: this.contentType() });
      }
      return this.getItemByIdService.get(item.id, canViewGroupPerms ? { watchedGroupId: this.group().id } : {}).pipe(
        map(fullItem => ({ name: fullItem.string.title, groupPerms: fullItem.watchedGroup?.permissions, ...fullItem })),
        catchError(err => {
          if (errorIsHTTPForbidden(err) || errorIsHTTPNotFound(err)) {
            return of({ id, name: undefined, groupPerms: undefined, permissions: undefined });
          }
          throw err;
        })
      );
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  existingItemState = toSignal(this.existingItemState$, { requireSync: true });

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
