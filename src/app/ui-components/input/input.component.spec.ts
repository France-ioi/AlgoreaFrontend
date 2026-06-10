import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';

import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ InputComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show and hide the clear button when the form control value changes programmatically', () => {
    const form = new FormBuilder().group({ search: [ 'hello' ] });
    fixture.componentRef.setInput('parentForm', form);
    fixture.componentRef.setInput('name', 'search');
    fixture.componentRef.setInput('hasClearButton', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.clear-button')).toBeTruthy();

    form.get('search')!.reset('');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.clear-button')).toBeFalsy();
  });
});
