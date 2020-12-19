import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription, timer } from 'rxjs';
import { ItemType } from '../../../../shared/helpers/item-type';
import { ItemFound, SearchItemService } from '../../../item/http-services/search-item.service';
import { debounce, filter, map, switchMap, tap } from 'rxjs/operators';
import { ChildData } from '../../../item/components/item-children-edit/item-children-edit.component';


const defaultFormValues = { create: '', searchExisting: '' };

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
})
export class AddContentComponent implements OnInit, OnDestroy {
  @Input() allowSkills = false;
  @Output() contentAdded = new EventEmitter<ChildData>();

  readonly minInputLength = 3;

  newContentForm: FormGroup = this.formBuilder.group(defaultFormValues);
  trimmedInputsValue = defaultFormValues;
  itemsFound: ItemFound[] = [];

  state: 'loading' | 'loaded' = 'loading';
  focused?: 'create' | 'searchExisting';

  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private searchItemService: SearchItemService,
  ) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.newContentForm.valueChanges.subscribe((changes: typeof defaultFormValues) => {
        this.trimmedInputsValue = {
          create: changes.create.trim(),
          searchExisting: changes.searchExisting.trim(),
        };
      })
    );

    const existingTitleControl: Observable<string> | undefined = this.newContentForm.get('searchExisting')?.valueChanges;
    if (existingTitleControl) this.subscriptions.push(
      existingTitleControl.pipe(
        map(value => value.trim()),
        filter(value => this.checkLength(value)),
        tap(_ => this.state = 'loading'),
        debounce(() => timer(300)),
        switchMap(value => this.searchItemService.search(value, [ 'Chapter', 'Course', 'Task' ]))
      )
        .subscribe(items => {
          this.itemsFound = items;
          this.state = 'loaded';
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onNewFocus(): void {
    if (this.focused === 'create') return;
    this.reset('create');
  }

  onExistingFocus(): void {
    if (this.focused === 'searchExisting') return;
    this.reset('searchExisting');
  }

  onBlur(): void {
    // Do not un-lighten the input if there is content in the other one
    if (this.focused === 'searchExisting' && this.trimmedInputsValue.searchExisting) return;
    if (this.focused === 'create' && this.trimmedInputsValue.create) return;
    this.focused = undefined;
  }

  addNewItem(type: ItemType): void {
    const title = this.trimmedInputsValue.create;
    if (!this.checkLength(title)) return;
    this.contentAdded.emit({
      title: title,
      type: type,
    });
    this.reset();
  }

  addExistingItem(item: ItemFound): void {
    this.contentAdded.emit(item);
    this.reset();
  }

  private checkLength(s: string): boolean {
    return s.length >= this.minInputLength;
  }

  private reset(focused?: 'searchExisting' | 'create'): void {
    this.newContentForm.reset(defaultFormValues);
    this.focused = focused;
  }

}
