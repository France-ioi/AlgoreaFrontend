import { Component, EventEmitter, forwardRef, Injector, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  UntypedFormGroup,
  NgControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  FormsModule
} from '@angular/forms';
import { Duration, MAX_SECONDS_FORMAT_DURATION, MAX_TIME_FORMAT_DURATION } from 'src/app/utils/duration';
import { FormErrorComponent } from '../form-error/form-error.component';
import { NgxMaskDirective } from 'ngx-mask';

const MAX_HOURS_VALUE = 23;
const MAX_MINUTES_VALUE = 59;
const MAX_SECONDS_VALUE = 59;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'alg-duration[ngModel], alg-duration[formControl], alg-duration[formControlName]',
  templateUrl: './duration.component.html',
  styleUrls: [ './duration.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DurationComponent),
      multi: true,
    },
  ],
  imports: [ FormsModule, FormErrorComponent, NgxMaskDirective ]
})
export class DurationComponent implements OnInit, OnChanges, ControlValueAccessor, Validator {
  private injector = inject(Injector);

  @Output() change = new EventEmitter<Duration | null>();

  @Input() name = '';
  @Input() parentForm?: UntypedFormGroup;
  @Input() layout: 'DHM' | 'HMS' = 'HMS';
  /**
   * Currently, the backend stores duration values with 2 distinct formats:
   * - 'time': uses MySQL 'time' column, has the shape "h:m:s" and is limited to 838:59:59
   * - 'seconds': the duration is stored as a number of seconds, the limit is the integer limit which is `2147483647`
   *
   * This property allows to decide which limit to apply for validation.
   *
   * If you are using the 'time' format, set `limitToTimeMax` to true.
   */
  @Input() limitToTimeMax = false;

  control?: AbstractControl;

  get maxDuration(): number {
    return this.limitToTimeMax ? MAX_TIME_FORMAT_DURATION : MAX_SECONDS_FORMAT_DURATION;
  }

  days = '0';
  hours = '0';
  minutes = '0';
  seconds = '0';

  showField = {
    days: false,
    hours: false,
    minutes: false,
    seconds: false,
  };

  ngOnInit(): void {
    // Inject NgControl at init to avoid circular dependency
    // https://stackoverflow.com/questions/39809084/injecting-ngcontrol-in-custom-validator-directive-causes-cyclic-dependency
    this.control = this.parentForm && this.name
      ? this.parentForm.get(this.name) ?? undefined
      : this.injector.get(NgControl, null)?.control ?? undefined;

    // Issue due the race condition (probably because of async method in writeValue in ngx-mask) from ngx mask and dirty state on init -
    // https://github.com/JsDaddy/ngx-mask/issues/1375#issuecomment-2243252405
    setTimeout(() => {
      this.showField = {
        days: this.layout === 'DHM',
        hours: this.layout === 'DHM' || this.layout === 'HMS',
        minutes: this.layout === 'DHM' || this.layout === 'HMS',
        seconds: this.layout === 'HMS',
      };
      this.control?.markAsPristine();
      this.control?.markAsUntouched();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.layout && !changes.layout.firstChange) throw new Error('layout must not change');
  }

  private onChange: (duration: Duration | null) => void = () => {};

  validate(control: AbstractControl): ValidationErrors | null {
    const duration = control.value as Duration | null;
    if (!duration) return null;
    if (!duration.isValid()) return { invalidDuration: { invalidDuration: true } };
    if (duration.ms > this.maxDuration) {
      const duration = new Duration(this.maxDuration);
      switch (this.layout) {
        case 'DHM':
          return { max: { max: duration.getDHM().join(':') } };
        case 'HMS':
          return { max: { max: duration.getHMS().join(':') } };
      }
    }
    return null;
  }

  writeValue(duration: Duration | null): void {
    if (!duration) return;
    switch (this.layout) {
      case 'HMS':
        [ this.hours, this.minutes, this.seconds ] = duration.getHMS();
        break;
      case 'DHM':
        [ this.days, this.hours, this.minutes ] = duration.getDHM();
        break;
    }
  }

  registerOnChange(fn: (duration: Duration | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (duration: Duration | null) => void): void {
  }

  emitValue(duration: Duration | null): void {
    this.change.emit(duration);
    this.onChange(duration);
  }

  handleChange(): void {
    switch (this.layout) {
      case 'DHM':
        return this.emitValue(this.handleDHMChange());
      case 'HMS':
        return this.emitValue(this.handleHMSChange());
    }
  }

  private handleHMSChange(): Duration | null {
    if (this.hours === '' || this.minutes === '' || this.seconds === '') return null;

    if (+this.minutes > MAX_MINUTES_VALUE) this.minutes = MAX_MINUTES_VALUE.toString();
    if (+this.seconds > MAX_SECONDS_VALUE) this.seconds = MAX_SECONDS_VALUE.toString();

    return Duration.fromHMS(+this.hours, +this.minutes, +this.seconds);
  }

  private handleDHMChange(): Duration | null {
    if (this.days === '' || this.hours === '' || this.minutes === '') return null;

    if (+this.hours > MAX_HOURS_VALUE) this.hours = MAX_HOURS_VALUE.toString();
    if (+this.minutes > MAX_MINUTES_VALUE) this.minutes = MAX_MINUTES_VALUE.toString();

    return Duration.fromDHM(+this.days, +this.hours, +this.minutes);
  }

}
