import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SwitchFieldComponent } from 'src/app/ui-components/collapsible-section/switch-field/switch-field.component';
import { DatePipe } from '@angular/common';
import { GroupApprovals, RequirePersonalInfoAccessApproval as PIApproval } from 'src/app/groups/models/group-approvals';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ModalComponent } from 'src/app/ui-components/modal/modal.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export type JoinGroupConfirmationDialogResult = { confirmed: true } | undefined;

@Component({
  selector: 'alg-join-group-confirmation-dialog',
  templateUrl: './join-group-confirmation-dialog.component.html',
  styleUrls: [ './join-group-confirmation-dialog.component.scss' ],
  imports: [
    SwitchFieldComponent,
    ReactiveFormsModule,
    DatePipe,
    ButtonComponent,
    ModalComponent,
  ]
})
export class JoinGroupConfirmationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);

  dialogRef = inject(DialogRef<JoinGroupConfirmationDialogResult>);

  data = signal(inject<{ name: string, params: GroupApprovals }>(DIALOG_DATA));

  form?: FormGroup<{
    agreeWithPersonalInfoView?: FormControl<boolean>,
    agreeWithLockMembership?: FormControl<boolean>,
  }>;

  ngOnInit(): void {
    const { requirePersonalInfoAccessApproval, requireLockMembershipApprovalUntil } = this.data().params;
    if (requirePersonalInfoAccessApproval !== PIApproval.None || requireLockMembershipApprovalUntil) {
      this.form = this.fb.nonNullable.group({});
      if (requirePersonalInfoAccessApproval !== PIApproval.None) {
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
