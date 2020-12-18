import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ItemType } from '../../../../shared/helpers/item-type';

interface ItemFound {
  // id: string,
  title: string,
  type: ItemType
}

const defaultFormValues = { create: '', searchExisting: '' };

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
})
export class AddContentComponent implements OnInit, OnDestroy {
  @Input() allowSkills = false;
  @Output() contentAdded = new EventEmitter<{ title: string, type: ItemType }>();

  readonly minInputLength = 3;

  newContentForm: FormGroup = this.formBuilder.group(defaultFormValues);
  trimmedInputsValue = defaultFormValues;

  focused?: 'searchExisting' | 'create';
  itemsFound: ItemFound[] = [
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
  ];

  private subscription?: Subscription;

  constructor(
    private formBuilder: FormBuilder,
  ) {
  }

  ngOnInit(): void {
    this.subscription = this.newContentForm.valueChanges.subscribe((changes: typeof defaultFormValues) => {
      this.trimmedInputsValue = {
        create: changes.create.trim(),
        searchExisting: changes.searchExisting.trim(),
      };
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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

  addExistingItem(): void {
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
