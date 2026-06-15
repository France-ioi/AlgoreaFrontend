import { Component, inject, input, output } from '@angular/core';
import {
  PropagationAdvancedConfigurationFormComponent
} from 'src/app/items/containers/propagation-advanced-configuration-form/propagation-advanced-configuration-form.component';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { ItemPermPropagations } from 'src/app/items/models/item-perm-propagation';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ModalComponent } from 'src/app/ui-components/modal/modal.component';

export interface PropagationAdvancedConfigurationDialogData {
  item: {
    id: string,
    title: string,
  },
  childTitle?: string,
  permissions: ItemCorePerm,
  itemPropagations: Partial<ItemPermPropagations>,
}

@Component({
  selector: 'alg-propagation-advanced-configuration-dialog',
  templateUrl: 'propagation-advanced-configuration-dialog.component.html',
  styleUrls: [ 'propagation-advanced-configuration-dialog.component.scss' ],
  imports: [
    PropagationAdvancedConfigurationFormComponent,
    ModalComponent,
  ]
})
export class PropagationAdvancedConfigurationDialogComponent {
  data = input(inject<PropagationAdvancedConfigurationDialogData>(DIALOG_DATA));

  dialogRef = inject(DialogRef);

  closeEvent = output<ItemPermPropagations | undefined>();
}
