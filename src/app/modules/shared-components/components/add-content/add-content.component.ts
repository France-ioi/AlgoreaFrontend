import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ItemType } from '../../../../shared/helpers/item-type';

interface ItemFound {
  // id: string,
  title: string,
  type: ItemType
}

const defaultFormValues = { newTitle: '', existingTitle: '' };

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

  focused?: 'existingTitle' | 'newTitle';
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
        newTitle: changes.newTitle.trim(),
        existingTitle: changes.existingTitle.trim(),
      };
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onNewFocus(): void {
    if (this.focused == 'newTitle') return;
    this.reset('newTitle');
  }

  onExistingFocus(): void {
    if (this.focused == 'existingTitle') return;
    this.reset('existingTitle');
  }

  onBlur(): void {
    // Do not un-lighten the input if there is content in the other one
    if (this.focused === 'existingTitle' && this.trimmedInputsValue.existingTitle) return;
    if (this.focused === 'newTitle' && this.trimmedInputsValue.newTitle) return;
    this.focused = undefined;
  }

  addNewItem(type: ItemType): void {
    const title = this.trimmedInputsValue.newTitle;
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

  private reset(focused?: 'existingTitle' | 'newTitle'): void {
    this.newContentForm.reset(defaultFormValues);
    this.focused = focused;
  }

}
