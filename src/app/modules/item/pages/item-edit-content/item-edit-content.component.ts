import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ItemData } from '../../services/item-datasource.service';
import { PossiblyInvisibleChildData } from '../../components/item-children-edit/item-children-edit.component';
import { AllowsEditingAllItemPipe } from 'src/app/shared/models/domain/item-edit-permission';
import { TextareaComponent } from '../../../shared-components/components/textarea/textarea.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-item-edit-content',
  templateUrl: './item-edit-content.component.html',
  styleUrls: [ './item-edit-content.component.scss' ],
  standalone: true,
  imports: [ NgIf, TextareaComponent, AllowsEditingAllItemPipe ]
})
export class ItemEditContentComponent {
  @Input() parentForm?: UntypedFormGroup;
  @Input() itemData? : ItemData;

  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

  constructor() {}

}
