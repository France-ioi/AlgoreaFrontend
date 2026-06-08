import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaskDirective } from './mask.directive';
import {
  applyNumericMask,
  applyTemplateMask,
  countDigitsBeforeIndex,
  formatMaskValue,
  parseMaskPattern,
  selectionIndexAfterDigits,
} from './mask.utils';

describe('mask.utils', () => {
  it('parses numeric alternatives as max digit length', () => {
    expect(parseMaskPattern('0||00||000')).toEqual({
      mode: 'numeric',
      maxDigits: 3,
      template: '',
    });
  });

  it('parses unlimited numeric mask', () => {
    expect(parseMaskPattern('0*')).toEqual({
      mode: 'numeric',
      maxDigits: Number.POSITIVE_INFINITY,
      template: '',
    });
  });

  it('parses template mask', () => {
    expect(parseMaskPattern('99/99/9999 99:99')).toEqual({
      mode: 'template',
      maxDigits: 12,
      template: '99/99/9999 99:99',
    });
  });

  it('formats numeric values with max length', () => {
    expect(applyNumericMask('12345', 3)).toBe('123');
  });

  it('formats template values with separators', () => {
    expect(applyTemplateMask('120120241030', '99/99/9999 99:99')).toBe('12/01/2024 10:30');
    expect(applyTemplateMask('12', '99/99/9999 99:99')).toBe('12/');
  });

  it('formats mask value based on parsed pattern', () => {
    const parsed = parseMaskPattern('99/99/9999 99:99');
    expect(formatMaskValue('120120241030', parsed)).toBe('12/01/2024 10:30');
  });

  it('counts digits before a cursor index', () => {
    expect(countDigitsBeforeIndex('12/01/2024 10:30', 4)).toBe(3);
  });

  it('maps digit count back to a cursor index in formatted value', () => {
    expect(selectionIndexAfterDigits('12/01/2024 10:30', 3)).toBe(4);
    expect(selectionIndexAfterDigits('12345', 3)).toBe(3);
  });
});

@Component({
  template: `
    <input
      [(ngModel)]="value"
      [algMask]="mask()"
      [suffix]="suffix()"
      [clearIfNotMatch]="clearIfNotMatch()"
    />
  `,
  imports: [FormsModule, MaskDirective],
})
class TestHostComponent {
  value = '';
  mask = signal('0||00');
  suffix = signal('');
  clearIfNotMatch = signal(false);
}

@Component({
  template: `
    <input
      [formControl]="control"
      [algMask]="mask()"
    />
  `,
  imports: [ReactiveFormsModule, MaskDirective],
})
class ReactiveTestHostComponent {
  control = new FormControl('');
  mask = signal('99/99/9999 99:99');
}

describe('MaskDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  });

  it('limits numeric input length', () => {
    input.value = '1234';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('12');
    expect(input.value).toBe('12');
  });

  it('accepts unlimited digits and appends suffix', () => {
    host.mask.set('0*');
    host.suffix.set(' pts');
    fixture.detectChanges();

    input.value = '12345 pts';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('12345');
    expect(input.value).toBe('12345 pts');
  });

  it('strips suffix while typing additional digits in a suffixed numeric field', () => {
    host.mask.set('0*');
    host.suffix.set(' pts');
    fixture.detectChanges();

    input.value = '123 pts';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('123');
    expect(input.value).toBe('123 pts');

    input.value = '1234 pts';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('1234');
    expect(input.value).toBe('1234 pts');
  });

  it('formats date template input', () => {
    host.mask.set('99/99/9999 99:99');
    fixture.detectChanges();

    input.value = '120120241030';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.value).toBe('12/01/2024 10:30');
    expect(input.value).toBe('12/01/2024 10:30');
  });

  it('clears incomplete template values on blur when clearIfNotMatch is true', () => {
    host.mask.set('99/99/9999 99:99');
    host.clearIfNotMatch.set(true);
    fixture.detectChanges();

    input.value = '12/01/2024';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.value).toBe('');
    expect(input.value).toBe('');
  });

  it('does not clear partial numeric values on blur when clearIfNotMatch is true', () => {
    host.mask.set('0||00');
    host.clearIfNotMatch.set(true);
    fixture.detectChanges();

    input.value = '1';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.value).toBe('1');
    expect(input.value).toBe('1');
  });

  it('formats raw digits written from a reactive form control', () => {
    const reactiveFixture = TestBed.createComponent(ReactiveTestHostComponent);
    reactiveFixture.detectChanges();
    const reactiveInput = reactiveFixture.nativeElement.querySelector('input') as HTMLInputElement;
    const reactiveHost = reactiveFixture.componentInstance;

    reactiveHost.control.setValue('010220230815');
    reactiveFixture.detectChanges();

    expect(reactiveInput.value).toBe('01/02/2023 08:15');
    expect(reactiveHost.control.value).toBe('01/02/2023 08:15');
  });
});
