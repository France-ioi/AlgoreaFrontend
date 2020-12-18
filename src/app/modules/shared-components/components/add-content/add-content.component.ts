import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ItemType } from '../../../../shared/helpers/item-type';

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
})
export class AddContentComponent implements OnInit, OnDestroy {
  @Input() allowSkills = false;
  @Output() contentAdded = new EventEmitter<{ title: string, type: ItemType }>();

  readonly minInputLength = 3;

  expanded = false;
  focused: 'existingTitle' | 'newTitle' | null = null;
  currentValue = '';

  private subscription?: Subscription;

  test = [
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
    { title: 'test', type: 'Chapter' },
  ]


  constructor(
    private formBuilder: FormBuilder,
  ) {
  }

  ngOnInit(): void {
    this.newContentForm.valueChanges.subscribe((change: {newTitle: string, existingTitle: string}) => {
      if (change.newTitle.length < 3 && change.existingTitle.length < 3) this.expanded = false;
      else {
        this.currentValue = change.newTitle.length > 2 ? change.newTitle : change.existingTitle;
        this.expanded = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onNewFocus(): void {
    this.focused = 'newTitle';
    this.newContentForm.get('existingTitle')?.setValue('');
  }

  onExistingFocus(): void {
    this.focused = 'existingTitle';
    this.newContentForm.get('newTitle')?.setValue('');
  }

  addNewItem(type: ItemType): void {
    if (!this.expanded) return;

    this.contentAdded.emit({
      title: this.currentValue,
      type: type,
    });
    this.newContentForm.reset({ title: '' });
  }

}
