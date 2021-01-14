import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProgressSectionValue } from 'src/app/modules/shared-components/components/progress-section/progress-section.component';
import { Permissions } from 'src/app/shared/http-services/group-permissions.service';
import { TypeFilter } from '../composition-filter/composition-filter.component';
import { generateCanEditValues, generateCanGrantViewValues,
  generateCanViewValues, generateCanWatchValues } from './permissions-edit-dialog-texts';

@Component({
  selector: 'alg-permissions-edit-dialog',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ]
})
export class PermissionsEditDialogComponent implements OnInit {

  @Input() visible?: boolean;
  @Input() title?: string;
  @Input() permissions?: Permissions;
  @Output() close = new EventEmitter<Permissions>();
  @Input() targetType: TypeFilter = 'Users';

  targetTypeString = '';

  canViewValues: ProgressSectionValue<string>[] = []
  canGrantViewValues: ProgressSectionValue<string>[] = []
  canWatchValues: ProgressSectionValue<string>[] = []
  canEditValues: ProgressSectionValue<string>[] = []

  ngOnInit(): void {
    this.canViewValues = generateCanViewValues(this.targetType);
    this.canGrantViewValues = generateCanGrantViewValues(this.targetType);
    this.canWatchValues = generateCanWatchValues(this.targetType);
    this.canEditValues = generateCanEditValues(this.targetType);
  }

  onClose(): void {
    if (this.permissions) this.close.emit(this.permissions);
  }
}
