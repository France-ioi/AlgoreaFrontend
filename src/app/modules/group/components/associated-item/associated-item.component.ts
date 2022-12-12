import { Component, forwardRef, Input, OnChanges, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, of, ReplaySubject, Subject, combineLatest } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/modules/item/http-services/get-item-by-id.service';
import { rawItemRoute, urlArrayForItemRoute } from 'src/app/shared/routing/item-route';
import { SearchItemService } from 'src/app/modules/item/http-services/search-item.service';
import {
  AddedContent, NewContentType,
} from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { ItemType, ItemTypeCategory } from 'src/app/shared/helpers/item-type';
import {
  NoAssociatedItem,
  NewAssociatedItem,
  ExistingAssociatedItem,
  isExistingAssociatedItem,
  isNewAssociatedItem,
  getAllowedTypesForNewAssociatedItem,
} from './associated-item-types';
import { errorIsHTTPForbidden } from 'src/app/shared/helpers/errors';
import { mapToFetchState } from 'src/app/shared/operators/state';

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
  ]
})
export class AssociatedItemComponent implements ControlValueAccessor, OnChanges, OnDestroy {
  @Input() contentType: ItemTypeCategory = 'activity';

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  private readonly contentType$ = new ReplaySubject<ItemTypeCategory>();

  private readonly itemChanges$ = new ReplaySubject<{
    item: NoAssociatedItem|NewAssociatedItem|(ExistingAssociatedItem&{ name?: string }),
    triggerChange: boolean,
  }>();

  private refresh$ = new Subject<void>();
  readonly state$ = combineLatest([
    this.itemChanges$,
    this.contentType$,
  ]).pipe(
    distinctUntilChanged(),
    switchMap(([ data, contentType ]) => {
      if (data.triggerChange) this.onChange(data.item);

      if (!isExistingAssociatedItem(data.item)) {
        return of({
          tag: data.item.tag, id: undefined, path: null,
          name: isNewAssociatedItem(data.item) ? data.item.name : undefined
        });
      }

      const id = data.item.id;
      const name = data.item.name !== undefined ? of(data.item.name) :
        this.getItemByIdService.get(id).pipe(map(item => item.string.title));

      return name.pipe(
        map(name => ({
          tag: 'existing-item',
          id,
          name,
          path: urlArrayForItemRoute(rawItemRoute(contentType, id))
        })),
        catchError(err => {
          if (errorIsHTTPForbidden(err)) return of({
            tag: 'existing-item',
            name: $localize`You don't have access to this ` + contentType === 'activity' ? $localize`activity` : $localize`skill` + '.',
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
    this.contentType$.pipe(
      switchMap(contentType =>
        this.searchItemService.search(value, contentType === 'activity' ? [ 'Chapter', 'Course', 'Task' ] : [ 'Skill' ])
      )
    );

  constructor(
    private getItemByIdService: GetItemByIdService,
    private searchItemService: SearchItemService,
  ) { }

  ngOnChanges(): void {
    this.allowedNewItemTypes = getAllowedTypesForNewAssociatedItem(this.contentType);
    this.contentType$.next(this.contentType);
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
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
        { tag: 'new-item', name: item.title, itemType: item.type },
      triggerChange: true
    });
  }

  refresh(): void {
    this.refresh$.next();
  }
}
