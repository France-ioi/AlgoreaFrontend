import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Item } from '../../http-services/get-item-by-id.service';

@Component({
  selector: 'alg-item-edit-advanced-parameters',
  templateUrl: './item-edit-advanced-parameters.component.html',
  styleUrls: ['./item-edit-advanced-parameters.component.scss']
})
export class ItemEditAdvancedParametersComponent implements OnInit {
  @Input() item?: Item;
  @Input() parentForm?: FormGroup;

  usesApi: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.reset();
  }

  reset(): void {
    if ( ! this.item ) return;
    this.usesApi = this.item.uses_api;
  }

  handleUsesApiChanges(checked: boolean): void {
    if (!this.parentForm || !this.parentForm.get('uses_api')) return undefined;
    this.parentForm.get('uses_api')?.setValue(checked);
    this.parentForm.markAsDirty();
    this.usesApi = checked;
  }

}
