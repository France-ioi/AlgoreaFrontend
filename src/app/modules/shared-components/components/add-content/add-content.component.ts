import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'alg-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: [ './add-content.component.scss' ],
})
export class AddContentComponent implements OnInit, OnDestroy {
  @Input() allowSkills = false;

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

}
