import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ModalComponent } from 'src/app/ui-components/modal/modal.component';
import { InputComponent } from 'src/app/ui-components/input/input.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

export interface AddPrerequisiteDialogData {
  prerequisiteTitle: string,
  dependentTitle: string,
}

const integerScoreValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: unknown = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return Number.isInteger(Number(value)) ? null : { integer: true };
};

@Component({
  selector: 'alg-add-prerequisite-dialog',
  templateUrl: './add-prerequisite-dialog.component.html',
  styleUrl: './add-prerequisite-dialog.component.scss',
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    ButtonComponent,
  ]
})
export class AddPrerequisiteDialogComponent {
  readonly data = inject<AddPrerequisiteDialogData>(DIALOG_DATA);
  dialogRef = inject(DialogRef<number>);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    score: this.fb.nonNullable.control(100, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
      integerScoreValidator,
    ]),
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(Number(this.form.controls.score.value));
  }
}
