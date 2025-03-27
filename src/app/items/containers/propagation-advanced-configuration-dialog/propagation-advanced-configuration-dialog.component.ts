import { Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import {
  PropagationAdvancedConfigurationFormComponent
} from 'src/app/items/containers/propagation-advanced-configuration-form/propagation-advanced-configuration-form.component';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { ItemPermPropagations } from 'src/app/items/models/item-perm-propagation';

export interface PropagationAdvancedConfigurationDialogData {
  permissions: ItemCorePerm,
  itemPropagations: Partial<ItemPermPropagations>,
}

@Component({
  selector: 'alg-propagation-advanced-configuration-dialog',
  templateUrl: 'propagation-advanced-configuration-dialog.component.html',
  styleUrls: [ 'propagation-advanced-configuration-dialog.component.scss' ],
  standalone: true,
  imports: [
    DialogModule,
    ButtonIconComponent,
    PropagationAdvancedConfigurationFormComponent,
  ],
})
export class PropagationAdvancedConfigurationDialogComponent {
  data = input.required<PropagationAdvancedConfigurationDialogData>();

  closeEvent = output<ItemPermPropagations | undefined>();
}
