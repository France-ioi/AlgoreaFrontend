import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Item } from '../../http-services/get-item-by-id.service';

@Component({
  selector: 'alg-item-edit-advanced-parameters',
  templateUrl: './item-edit-advanced-parameters.component.html',
  styleUrls: [ './item-edit-advanced-parameters.component.scss' ]
})
export class ItemEditAdvancedParametersComponent implements OnInit {
  @Input() item?: Item;
  @Input() parentForm?: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }

}
