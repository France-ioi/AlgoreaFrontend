import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, Validators } from '@angular/forms';

import { FormErrorComponent } from './form-error.component';

describe('FormErrorComponent', () => {
  let fixture: ComponentFixture<FormErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ FormErrorComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormErrorComponent);
  });

  it('should show required error when control becomes invalid', () => {
    const control = new FormControl('ok', Validators.required);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('This field is required');

    control.setValue('');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');
  });

  it('should hide errors when control becomes valid', () => {
    const control = new FormControl('', Validators.required);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');

    control.setValue('ok');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('This field is required');
  });

  it('should show errors after parent form silent patchValue and updateValueAndValidity', () => {
    const fb = new FormBuilder();
    const form = fb.nonNullable.group({ title: [ 'ok', Validators.required ] });
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('inputName', 'title');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('This field is required');

    form.patchValue({ title: '' }, { emitEvent: false });
    form.updateValueAndValidity({ emitEvent: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required');
  });
});
