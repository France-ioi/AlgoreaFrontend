import { Component, forwardRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { rawItemRoute, urlArrayForItemRoute } from 'src/app/models/routing/item-route';
import { SearchItemService } from 'src/app/data-access/search-item.service';
import {
  AddedContent, NewContentType,
} from 'src/app/ui-components/add-content/add-content.component';
import { ItemType, ItemTypeCategory } from 'src/app/models/item-type';
import {
  NoAssociatedItem,
  NewAssociatedItem,
  ExistingAssociatedItem,
  isExistingAssociatedItem,
  isNewAssociatedItem,
} from './associated-item-types';
import { errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/utils/errors';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { getAllowedNewItemTypes } from 'src/app/models/new-item-types';
import { RouterLink } from '@angular/router';
import { AddContentComponent } from 'src/app/ui-components/add-content/add-content.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { SectionComponent } from 'src/app/ui-components/section/section.component';
import { NgIf, NgSwitch, NgSwitchCase, NgClass, AsyncPipe, I18nSelectPipe, NgTemplateOutlet } from '@angular/common';
import { ButtonModule } from 'primeng/button';

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
    SectionComponent,
    LoadingComponent,
    ErrorComponent,
    NgSwitch,
    NgSwitchCase,
    AddContentComponent,
    RouterLink,
    NgClass,
    AsyncPipe,
    I18nSelectPipe,
    ButtonModule,
    NgTemplateOutlet
  ],
})
export class AssociatedItemComponent implements ControlValueAccessor, OnChanges, OnDestroy {
  @Input() contentType: ItemTypeCategory = 'activity';

  allowedNewItemTypes: NewContentType<ItemType>[] = [];

  private readonly itemChanges$ = new ReplaySubject<{
    item: NoAssociatedItem|NewAssociatedItem|(ExistingAssociatedItem&{ name?: string }),
    triggerChange: boolean,
  }>();

  private refresh$ = new Subject<void>();
  readonly state$ = this.itemChanges$.pipe(
    distinctUntilChanged(),
    switchMap(data => {
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
          path: urlArrayForItemRoute(rawItemRoute(this.contentType, id))
        })),
        catchError(err => {
          if (errorIsHTTPForbidden(err)) return of({
            tag: 'existing-item',
            name: $localize`You don't have access to this ` + (this.contentType === 'activity'
              ? $localize`activity` : $localize`skill`) + '.',
            path: null,
          });
          else if (errorIsHTTPNotFound(err)) return of({
            tag: 'existing-item',
            name: $localize`The configured ` + (this.contentType === 'activity'
              ? $localize`activity` : $localize`skill`) + $localize` is currently not visible to you.`,
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
