import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SwitchFieldComponent } from '../../../ui-components/collapsible-section/switch-field/switch-field.component';
import { DatePipe, I18nSelectPipe } from '@angular/common';
import { GroupApprovals } from '../../data-access/get-group-by-id.service';

export type JoinGroupConfirmationDialogParams = GroupApprovals & { id: string, name: string };
export type JoinGroupConfirmEvent = {
  id: string,
  name: string,
  approvals: string[],
};

enum Approvals {
  personalInfoView = 'personal_info_view',
  lockMembership = 'lock_membership',
  watch = 'watch',
}

@Component({
  selector: 'alg-join-group-confirmation-dialog[params]',
  templateUrl: './join-group-confirmation-dialog.component.html',
  styleUrls: ['./join-group-confirmation-dialog.component.scss'],
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    SwitchFieldComponent,
    ReactiveFormsModule,
    I18nSelectPipe,
    DatePipe,
  ],
})
export class JoinGroupConfirmationDialogComponent implements OnInit {
  @Output() cancelEvent = new EventEmitter<void>();
  @Output() confirmEvent = new EventEmitter<JoinGroupConfirmEvent>();
  @Input() params!: JoinGroupConfirmationDialogParams;

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
          this.fb.nonNullable.control({ value: false, disabled: false }, Validators.requiredTrue)
        );
      }
      if (requireLockMembershipApprovalUntil) {
        this.form.addControl(
          'agreeWithLockMembership',
          this.fb.nonNullable.control({ value: false, disabled: false }, Validators.requiredTrue)
        );
      }
    }
  }

  onCancel(): void {
    this.cancelEvent.emit();
  }

  onAccept(): void {
    if (this.form?.invalid) throw new Error('Unexpected: Must be selected all approval values');
    const agreeWithPersonalInfoView = this.form?.value.agreeWithPersonalInfoView;
    const agreeWithLockMembership = this.form?.value.agreeWithLockMembership;
    const approvals = [
      ...(agreeWithPersonalInfoView ? [ Approvals.personalInfoView ] : []),
      ...(agreeWithLockMembership ? [ Approvals.lockMembership ] : []),
    ];
    this.confirmEvent.emit({
      id: this.params.id,
      name: this.params.name,
      approvals,
    });
  }
}
