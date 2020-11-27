import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ItemType } from '../../../../shared/helpers/item-type';
import { NewItem } from '../../../item/http-services/create-item.service';

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
})
export class AddContentComponent implements OnInit, OnDestroy {
  @Input() allowSkills = false;
  @Output() childrenAdded = new EventEmitter<NewItem>();

  newContentForm: FormGroup = this.formBuilder.group({ title: '' });

  state: 'opened' | 'closed' = 'closed';
  subscription?: Subscription;


  constructor(
    private formBuilder: FormBuilder,
  ) {
  }

  ngOnInit(): void {
    this.subscription = this.newContentForm.get('title')?.valueChanges
      .subscribe((change: string) => this.state = change.length > 2 ? 'opened' : 'closed');
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onClick(type: ItemType): void {
    if (this.state === 'closed') return;
    const control = this.newContentForm.get('title');
    if (!control) return;

    this.childrenAdded.emit({
      title: control.value as string,
      language_tag: 'en',
      item: { type: type }
    });
    this.newContentForm.reset({ title: '' });
  }

}
