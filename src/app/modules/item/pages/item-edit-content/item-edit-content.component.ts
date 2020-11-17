import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ItemData } from '../../services/item-datasource.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ]
})
export class ItemEditContentComponent {
  @Input() parentForm?: FormGroup;
  @Input() itemData$? : Observable<ItemData>;

  constructor() {}

}
