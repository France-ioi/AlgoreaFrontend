import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemDataSource } from '../../services/item-datasource.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Item } from '../../http-services/get-item-by-id.service';

interface itemValues {
  title: string
}

const defaultItemValues: itemValues = {
  title: ''
};

@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss']
})
export class ItemEditComponent implements OnDestroy {
  item: Item;
  itemForm: FormGroup;
  itemValues: itemValues;

  itemSubscription: Subscription;

  changedInput: { [input: string]: string } = {};

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
    private formBuilder: FormBuilder,
  ) {
    this.currentContent.editState.next('editing');
    this.getCurrentItem();
    this.initForm();
    this.itemValues = defaultItemValues;
  }

  ngOnDestroy() {
    this.currentContent.editState.next('non-editable');
    this.itemSubscription.unsubscribe();
  }

  initForm(): void {
    this.itemForm = this.formBuilder.group({
      title: [defaultItemValues.title]
    });
  }

  getCurrentItem(): void {
    this.itemSubscription = this.itemDataSource.item$.subscribe(item => {
      this.item = item;
      this.itemValues.title = item.string.title ? item.string.title : '';
      this.itemForm.patchValue({
        title: item.string.title
      });
    });
  }

  onInputChange(name: string, value: string): void {
    if (typeof (value) == 'object')
      return;

    this.changedInput[name] = value;
  }

}
