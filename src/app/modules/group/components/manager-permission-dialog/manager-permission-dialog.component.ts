import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-manager-permission-dialog',
  templateUrl: './manager-permission-dialog.component.html',
  styleUrls: [ './manager-permission-dialog.component.scss' ],
})
export class ManagerPermissionDialogComponent {
  @Input() visible?: boolean;
  @Input() group?: Group;
  @Input() title?: string;

  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onAccept(): void {}
}
