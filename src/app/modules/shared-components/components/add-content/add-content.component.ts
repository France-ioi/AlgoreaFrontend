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

  newContentForm: FormGroup = this.formBuilder.group({ title: '' });

  state: 'opened' | 'closed' = 'closed';
  private subscription?: Subscription;


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

    this.contentAdded.emit({
      title: control.value as string,
      type: type,
    });
    this.newContentForm.reset({ title: '' });
  }

}
