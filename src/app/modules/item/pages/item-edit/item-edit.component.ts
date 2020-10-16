import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';


@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss']
})
export class ItemEditComponent implements OnInit, OnDestroy {
  itemForm = this.formBuilder.group({
    title: ['', Validators.required],
  });

  itemSubscription: Subscription;

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
  ) {
    this.currentContent.editState.next('editing');
  }

  ngOnInit() {
    this.getCurrentItem();
  }

  ngOnDestroy() {
    this.currentContent.editState.next('non-editable');
    this.itemSubscription.unsubscribe();
  }

  getCurrentItem(): void {
    this.itemSubscription = this.itemDataSource.item$.subscribe(item => {
      this.itemForm.patchValue({
        title: item.string.title
      });
    });
  }

}
