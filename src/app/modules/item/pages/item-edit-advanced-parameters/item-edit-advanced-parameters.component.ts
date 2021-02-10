import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-edit-advanced-parameters',
  templateUrl: './item-edit-advanced-parameters.component.html',
  styleUrls: ['./item-edit-advanced-parameters.component.scss']
})
export class ItemEditAdvancedParametersComponent implements OnInit {
  @Input() itemData?: ItemData;
  @Input() parentForm?: FormGroup;

  @Output() usesApiChanges: EventEmitter<boolean> = new EventEmitter<boolean>();
  usesApi: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.reset();
  }

  reset(): void {
    if ( ! this.itemData ) return;
    this.usesApi = this.itemData.item.uses_api;
  }

  handleUsesApiChanges(checked: boolean): void {
    this.usesApi = checked;
    this.usesApiChanges.emit(checked);
  }

}
