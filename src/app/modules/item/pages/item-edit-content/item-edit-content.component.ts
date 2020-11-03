import { Component, Input } from '@angular/core';
import { ItemDataSource } from '../../services/item-datasource.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ]
})
export class ItemEditContentComponent {
  @Input() inputName = '';
  @Input() parentForm?: FormGroup;

  itemData$ = this.itemDataSource.itemData$;

  constructor(
    private itemDataSource: ItemDataSource,
  ) {
  }

  updateForm(value: string): void {
    const input = this.parentForm?.get(this.inputName);
    input?.setValue(value);
  }

}
