import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl, UntypedFormGroup, ValidationErrors } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { EMPTY, merge, startWith } from 'rxjs';

@Component({
  selector: 'alg-input-error',
  templateUrl: './form-error.component.html',
  styleUrl: './form-error.component.scss',
  imports: [ DatePipe ]
})
export class FormErrorComponent {
  form = input<UntypedFormGroup>();
  inputName = input('');
  control = input<AbstractControl>();

  protected readonly resolvedControl = computed(() =>
    this.control() ?? this.form()?.get(this.inputName()) ?? undefined
  );

  protected readonly controlErrors = signal<ValidationErrors | null>(null);

  constructor() {
    effect(onCleanup => {
      const control = this.resolvedControl();
      const form = this.form();
      if (!control) {
        this.controlErrors.set(null);
        return;
      }

      const syncErrors = (): void => {
        this.controlErrors.set(control.errors);
      };

      // startWith(null) emits synchronously while this effect runs, which writes to
      // controlErrors during effect execution — intentional to seed the initial state.
      syncErrors();
      const sub = merge(
        control.statusChanges,
        control.valueChanges,
        form && !this.control() ? form.statusChanges : EMPTY,
      )
        .pipe(startWith(null))
        .subscribe(syncErrors);

      onCleanup(() => sub.unsubscribe());
    });
  }
}
