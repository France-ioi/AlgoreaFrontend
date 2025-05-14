import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SwitchFieldComponent } from 'src/app/ui-components/collapsible-section/switch-field/switch-field.component';
import { DatePipe } from '@angular/common';
import { GroupApprovals } from 'src/app/groups/models/group-approvals';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-join-group-confirmation-dialog',
  templateUrl: './join-group-confirmation-dialog.component.html',
  styleUrls: [ './join-group-confirmation-dialog.component.scss' ],
  standalone: true,
  imports: [
    DialogModule,
    SwitchFieldComponent,
    ReactiveFormsModule,
    DatePipe,
    ButtonComponent,
    ButtonIconComponent,
  ],
})
export class JoinGroupConfirmationDialogComponent implements OnInit {
  @Output() cancelEvent = new EventEmitter<void>();
  @Output() confirmEvent = new EventEmitter<void>();
  @Input() name = '';
  @Input({ required: true }) params!: GroupApprovals;

  form?: FormGroup<{
    agreeWithPersonalInfoView?: FormControl<boolean>,
    agreeWithLockMembership?: FormControl<boolean>,
  }>;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    const { requirePersonalInfoAccessApproval, requireLockMembershipApprovalUntil } = this.params;
    if (requirePersonalInfoAccessApproval !== 'none' || requireLockMembershipApprovalUntil) {
      this.form = this.fb.nonNullable.group({});
      if (requirePersonalInfoAccessApproval !== 'none') {
        this.form.addControl(
          'agreeWithPersonalInfoView',
          this.fb.nonNullable.control({
            value: false,
            disabled: false,
          }, Validators.requiredTrue),
        );
      }
      if (requireLockMembershipApprovalUntil) {
        this.form.addControl(
          'agreeWithLockMembership',
          this.fb.nonNullable.control({
            value: false,
            disabled: false,
          }, Validators.requiredTrue),
        );
      }
    }
  }
}
