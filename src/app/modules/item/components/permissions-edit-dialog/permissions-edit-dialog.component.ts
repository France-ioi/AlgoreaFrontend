import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { merge, Subject, Subscription } from 'rxjs';
import { GroupPermissions } from 'src/app/shared/http-services/group-permissions.service';
import { PermissionsInfo } from '../../helpers/item-permissions';
import { permissionsConstraintsValidator } from '../../helpers/permissions-constraints-validator';
import { PermissionsDialogData, generateValues } from '../../helpers/permissions-texts';
import { TypeFilter } from '../composition-filter/composition-filter.component';

@Component({
  selector: 'alg-permissions-edit-dialog',
  templateUrl: './permissions-edit-dialog.component.html',
  styleUrls: [ './permissions-edit-dialog.component.scss' ]
})
export class PermissionsEditDialogComponent implements OnChanges, OnDestroy {

  @Input() visible?: boolean;
  @Input() title?: string;
  @Input() permissions?: Omit<GroupPermissions,'canEnterFrom'|'canEnterUntil'>;
  @Input() giverPermissions?: PermissionsInfo;
  @Input() targetType: TypeFilter = 'Users';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<GroupPermissions>>();

  targetTypeString = '';

  permissionsDialogData: PermissionsDialogData = {
    canViewValues: [],
    canGrantViewValues: [],
    canEditValues: [],
    canWatchValues: [],
  };

  form = this.fb.group({
    canView: [ 'none' ],
    canGrantView: [ 'none' ],
    canWatch: [ 'none' ],
    canEdit: [ 'none' ],
    canMakeSessionOfficial: [ false ],
    isOwner: [ true ],
  });

  private regenerateValues = new Subject<void>();
  private subscription?: Subscription;

  constructor(private fb: FormBuilder) {
    this.subscription = merge(
      this.form.valueChanges,
      this.regenerateValues.asObservable()
    ).subscribe(() => {
      if (this.permissions && this.giverPermissions) {
        const receiverPermissions = this.form.value as GroupPermissions;
        this.permissionsDialogData = generateValues(this.targetType, receiverPermissions, this.giverPermissions);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.regenerateValues.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.permissions || changes.giverPermissions) {
      if (this.permissions && this.giverPermissions) {
        this.form.setValidators(permissionsConstraintsValidator(this.giverPermissions, this.targetType));
        this.form.updateValueAndValidity();
        this.form.reset({ ...this.permissions }, { emitEvent: false });
      }
    }
    if (changes.targetType) this.regenerateValues.next();
  }

  onCancel(): void {
    this.close.emit();
  }

  onAccept(): void {
    if (!this.form.dirty || this.form.invalid) return;

    const groupPermissions: Partial<GroupPermissions> = {
      canView: this.form.get('canView')?.value as GroupPermissions['canView'],
      canGrantView: this.form.get('canGrantView')?.value as GroupPermissions['canGrantView'],
      canWatch: this.form.get('canWatch')?.value as GroupPermissions['canWatch'],
      canEdit: this.form.get('canEdit')?.value as GroupPermissions['canEdit'],
      canMakeSessionOfficial: this.form.get('canMakeSessionOfficial')?.value as GroupPermissions['canMakeSessionOfficial'],
      isOwner: this.form.get('isOwner')?.value as GroupPermissions['isOwner'],
    };

    this.save.emit(groupPermissions);
    this.close.emit();
  }
}
