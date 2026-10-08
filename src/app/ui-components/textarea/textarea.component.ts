import { Component, computed, effect, input, signal } from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error.component';
import { merge, startWith } from 'rxjs';

// Show the character counter once the text reaches 90% of the configured limit.
const COUNTER_VISIBILITY_RATIO = 0.9;

/** Ensures each textarea instance gets a unique counter element id for aria-describedby. */
let nextTextareaInstanceId = 0;

@Component({
  selector: 'alg-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FormErrorComponent,
  ]
})
export class TextareaComponent {
  inputName = input(''); // name of the input in the parent form
  parentForm = input<UntypedFormGroup>();

  icon = input('');
  placeholder = input('');
  /** When true, the user can drag the bottom edge to enlarge the textarea vertically. */
  resizable = input(false);
  /**
   * Optional soft max length for the character counter and over-limit styling.
   * Does not set the native `maxlength` attribute (so paste is not truncated).
   */
  maxLength = input<number | null>(null);

  private readonly controlValue = signal('');
  private readonly instanceId = nextTextareaInstanceId++;

  protected readonly length = computed(() => this.controlValue().length);
  protected readonly showCounter = computed(() => {
    const max = this.maxLength();
    return typeof max === 'number' && this.length() >= COUNTER_VISIBILITY_RATIO * max;
  });
  protected readonly overLimit = computed(() => {
    const max = this.maxLength();
    return typeof max === 'number' && this.length() > max;
  });
  protected readonly counterId = computed(
    () => `alg-textarea-counter-${ this.inputName() }-${ this.instanceId }`
  );

  constructor() {
    effect(onCleanup => {
      const form = this.parentForm();
      const name = this.inputName();
      const control = form?.get(name);
      if (!form || !control) {
        this.controlValue.set('');
        return;
      }

      const syncValue = (): void => {
        const raw: unknown = control.value;
        this.controlValue.set(typeof raw === 'string' ? raw : '');
      };

      // startWith emits synchronously while this effect runs — intentional to seed initial length.
      // Listen to form statusChanges too: language-tab switches patch silently then call
      // form.updateValueAndValidity (same pattern as alg-input-error).
      syncValue();
      const sub = merge(control.valueChanges, control.statusChanges, form.statusChanges)
        .pipe(startWith(null))
        .subscribe(syncValue);
      onCleanup(() => sub.unsubscribe());
    });
  }
}
