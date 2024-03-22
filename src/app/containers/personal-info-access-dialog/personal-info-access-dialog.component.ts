import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SwitchFieldComponent } from '../../ui-components/collapsible-section/switch-field/switch-field.component';
import { JoinByCodeGroupInfo } from '../../data-access/join-by-code.service';
import { DatePipe, I18nSelectPipe } from '@angular/common';

enum Approvals {
  personalInfoView = 'personal_info_view',
  lockMembership = 'lock_membership',
  watch = 'watch',
}

@Component({
  selector: 'alg-personal-info-access-dialog[groupInfo]',
  templateUrl: './personal-info-access-dialog.component.html',
  styleUrls: ['./personal-info-access-dialog.component.scss'],
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
export class PersonalInfoAccessDialogComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<string[]>();
  @Input() groupInfo!: JoinByCodeGroupInfo;

  form = this.fb.nonNullable.group<{
    agreeWithPersonalInfoView?: boolean,
    agreeWithLockMembership?: boolean,
  }>({});

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    const { requirePersonalInfoAccessApproval, requireLockMembershipApprovalUntil } = this.groupInfo;
    if (requirePersonalInfoAccessApproval !== 'none') {
      this.form.addControl(
        'agreeWithPersonalInfoView',
        this.fb.nonNullable.control({value: false, disabled: false}, Validators.requiredTrue)
      );
    }
    if (requireLockMembershipApprovalUntil) {
      this.form.addControl(
        'agreeWithLockMembership',
        this.fb.nonNullable.control({value: false, disabled: false}, Validators.requiredTrue)
      );
    }
  }

  onCancel(): void {
    this.closeEvent.emit();
  }

  onAccept(): void {
    if (this.form.invalid) throw new Error('Unexpected: Must be selected all approval values');
    const agreeWithPersonalInfoView = this.form.getRawValue().agreeWithPersonalInfoView;
    const agreeWithLockMembership = this.form.getRawValue().agreeWithLockMembership;
    const approvals = [
      ...(agreeWithPersonalInfoView ? [ Approvals.personalInfoView ] : []),
      ...(agreeWithLockMembership ? [ Approvals.lockMembership ] : []),
    ];
    if (approvals.length === 0) throw new Error('Unexpected: Approvals cannot be empty');
    console.log('approvals', approvals);
    this.closeEvent.emit(approvals);
  }
}
