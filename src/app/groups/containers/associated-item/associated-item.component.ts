import { Component, forwardRef, input, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, of, ReplaySubject, Subject, combineLatest } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { itemRoute, urlArrayForItemRoute } from 'src/app/models/routing/item-route';
import { SearchItemService } from 'src/app/data-access/search-item.service';
import {
  AddedContent, NewContentType,
} from 'src/app/ui-components/add-content/add-content.component';
import { ItemType, ItemTypeCategory } from 'src/app/items/models/item-type';
import {
  NoAssociatedItem,
  NewAssociatedItem,
  ExistingAssociatedItem,
  isExistingAssociatedItem,
  isNewAssociatedItem,
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
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { GroupInfo } from 'src/app/store/observation/observation.state';
import { toObservable } from '@angular/core/rxjs-interop';
import { AllowsViewingItemInfoPipe } from 'src/app/items/models/item-view-permission';
import { AllowsGrantingViewItemPipe } from 'src/app/items/models/item-grant-view-permission';
import { AllowsWatchingItemResultsPipe } from 'src/app/items/models/item-watch-permission';

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
export class AssociatedItemComponent implements ControlValueAccessor, OnChanges, OnDestroy {
  @Input() contentType: ItemTypeCategory = 'activity';
  observedGroup = input<{ route: RawGroupRoute } & GroupInfo>();

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  private readonly itemChanges$ = new ReplaySubject<{
    item: NoAssociatedItem|NewAssociatedItem|(ExistingAssociatedItem&{ name?: string }),
    triggerChange: boolean,
  }>();

  private refresh$ = new Subject<void>();
  readonly state$ = combineLatest([
    this.itemChanges$,
    toObservable(this.observedGroup),
  ]).pipe(
    distinctUntilChanged(([ prevItem, prevObservedGroup ], [ item, observedGroup ]) =>
      prevItem === item && prevObservedGroup === observedGroup
    ),
    switchMap(([ data, observedGroup ]) => {
      if (data.triggerChange) this.onChange(data.item);

      if (!isExistingAssociatedItem(data.item)) {
        return of({
          tag: data.item.tag, id: undefined, path: null,
          name: isNewAssociatedItem(data.item) ? data.item.name : undefined
        });
      }

      const id = data.item.id;

      if (data.item.name !== undefined && !observedGroup) {
        return of({
          tag: 'existing-item',
          id,
          permissions: undefined,
          name: data.item.name,
          path: urlArrayForItemRoute(itemRoute(this.contentType, id))
        });
      }

      return this.getItemByIdService.get(id, observedGroup?.route.id).pipe(
        map(item => ({
          tag: 'existing-item',
          id,
          name: item.string.title,
          permissions: item.watchedGroup ? {
            item: item.permissions,
            group: item.watchedGroup.permissions,
          } : undefined,
          path: urlArrayForItemRoute(itemRoute(this.contentType, id))
        })),
        catchError(err => {
          if (errorIsHTTPForbidden(err)) return of({
            tag: 'existing-item',
            name: $localize`You don't have access to this ` + (this.contentType === 'activity'
              ? $localize`activity` : $localize`skill`) + '.',
            permissions: undefined,
            path: null,
          });
          else if (errorIsHTTPNotFound(err)) return of({
            tag: 'existing-item',
            name: $localize`The configured ` + (this.contentType === 'activity'
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
    this.searchItemService.search(value, this.contentType === 'activity' ? [ 'Chapter', 'Task' ] : [ 'Skill' ]);

  constructor(
    private getItemByIdService: GetItemByIdService,
    private searchItemService: SearchItemService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.contentType && !changes.contentType.firstChange && changes.contentType.currentValue
      !== changes.contentType.previousValue) {
      throw new Error('Unexpected: Not allow to change content type');
    }
    this.allowedNewItemTypes = getAllowedNewItemTypes({
      allowActivities: this.contentType === 'activity',
      allowSkills: this.contentType === 'skill',
    });
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.itemChanges$.complete();
  }

  writeValue(rootItem: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem): void {
    this.itemChanges$.next({ item: rootItem, triggerChange: false });
  }

  registerOnChange(fn: (value: NoAssociatedItem|NewAssociatedItem|ExistingAssociatedItem) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: () => void): void {
  }

  onRemove(): void {
    this.itemChanges$.next({
      item: { tag: 'no-item' }, triggerChange: true });
  }

  setRootItem(item: AddedContent<ItemType>): void {
    this.itemChanges$.next({
      item: item.id !== undefined ?
        { tag: 'existing-item', id: item.id, name: item.title } :
        { tag: 'new-item', name: item.title, url: item.url, itemType: item.type },
      triggerChange: true
    });
  }

  refresh(): void {
    this.refresh$.next();
  }
}
