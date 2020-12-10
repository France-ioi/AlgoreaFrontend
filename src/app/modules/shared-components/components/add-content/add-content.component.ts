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

  newContentForm: FormGroup = this.formBuilder.group({ newTitle: '', existingTitle: '' });

  state: 'opened' | 'closed' = 'closed';
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
      if (change.newTitle.length < 3 && change.existingTitle.length < 3) this.state = 'closed';
      else {
        this.currentValue = change.newTitle.length > 2 ? change.newTitle : change.existingTitle;
        this.state = 'opened';
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onFocus(name: 'existingTitle' | 'newTitle'): void {
    this.focused = name;
    if (name === 'existingTitle') this.newContentForm.get('newTitle')?.setValue('');
    else this.newContentForm.get('existingTitle')?.setValue('');
  }

  onBlur(): void {
    this.focused = null;
  }

  addNewItem(type: ItemType): void {
    if (this.state === 'closed') return;

    this.contentAdded.emit({
      title: this.currentValue,
      type: type,
    });
    this.newContentForm.reset({ title: '' });
  }

}
