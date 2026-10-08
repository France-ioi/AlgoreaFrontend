import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';

import { TextareaComponent } from './textarea.component';

describe('TextareaComponent', () => {
  let fixture: ComponentFixture<TextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TextareaComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TextareaComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show a length counter when maxLength is not set', () => {
    const form = new FormBuilder().group({ description: [ 'a'.repeat(1000) ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]')).toBeNull();
  });

  it('should not show a length counter below 90% of maxLength', () => {
    const maxLength = 100;
    const form = new FormBuilder().group({ description: [ 'a'.repeat(89) ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.componentRef.setInput('maxLength', maxLength);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]')).toBeNull();
  });

  it('should show a length counter at 90% of maxLength', () => {
    const maxLength = 100;
    const form = new FormBuilder().group({ description: [ 'a'.repeat(90) ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.componentRef.setInput('maxLength', maxLength);
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]') as HTMLElement;
    expect(counter).toBeTruthy();
    expect(counter.textContent).toContain('90/100');
    expect(counter.classList.contains('over-limit')).toBeFalse();
  });

  it('should show a length counter at exactly maxLength without over-limit styling', () => {
    const maxLength = 100;
    const form = new FormBuilder().group({ description: [ 'a'.repeat(maxLength) ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.componentRef.setInput('maxLength', maxLength);
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]') as HTMLElement;
    expect(counter).toBeTruthy();
    expect(counter.textContent).toContain('100/100');
    expect(counter.classList.contains('over-limit')).toBeFalse();
  });

  it('should set aria-describedby to the counter id when visible and remove it when hidden', () => {
    const maxLength = 100;
    const form = new FormBuilder().group({ description: [ 'a'.repeat(90) ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.componentRef.setInput('maxLength', maxLength);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const counter = fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]') as HTMLElement;
    expect(counter).toBeTruthy();
    expect(textarea.getAttribute('aria-describedby')).toBe(counter.id);
    expect(counter.id).toContain('alg-textarea-counter-description-');

    form.get('description')!.setValue('a'.repeat(89));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]')).toBeNull();
    expect(textarea.getAttribute('aria-describedby')).toBeNull();
  });

  it('should mark the counter over-limit when length exceeds maxLength', () => {
    const maxLength = 100;
    const form = new FormBuilder().group({
      description: [ 'a'.repeat(101), Validators.maxLength(maxLength) ],
    });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.componentRef.setInput('maxLength', maxLength);
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]') as HTMLElement;
    expect(counter).toBeTruthy();
    expect(counter.textContent).toContain('101/100');
    expect(counter.classList.contains('over-limit')).toBeTrue();
  });

  it('should update the counter after silent patchValue and updateValueAndValidity (language tab switch)', () => {
    const maxLength = 100;
    const form = new FormBuilder().group({ description: [ '' ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.componentRef.setInput('maxLength', maxLength);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]')).toBeNull();

    form.patchValue({ description: 'a'.repeat(95) }, { emitEvent: false });
    form.updateValueAndValidity({ emitEvent: true });
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('[data-testid="textarea-length-counter"]') as HTMLElement;
    expect(counter).toBeTruthy();
    expect(counter.textContent).toContain('95/100');
  });

  it('should not set the native maxlength attribute', () => {
    const form = new FormBuilder().group({ description: [ '' ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('inputName', 'description');
    fixture.componentRef.setInput('maxLength', 100);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('maxlength')).toBeNull();
  });
});
