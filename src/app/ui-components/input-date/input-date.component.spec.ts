import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { InputDateComponent } from './input-date.component';

describe('InputDateComponent', () => {
  let fixture: ComponentFixture<InputDateComponent>;
  let component: InputDateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ InputDateComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(InputDateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('validate', () => {
    it('should return null for a valid date', () => {
      const control = new FormControl(new Date('2021-06-01'), { nonNullable: true });
      expect(component.validate(control)).toBeNull();
    });

    it('should return inputDateInvalid for an invalid date', () => {
      const control = new FormControl(new Date('invalid'), { nonNullable: true });
      expect(component.validate(control)).toEqual({ inputDateInvalid: true });
    });

    it('should return inputDateMinInvalid when value is before minDate', () => {
      const minDate = new Date('2021-06-01');
      fixture.componentRef.setInput('minDate', minDate);
      const control = new FormControl(new Date('2021-05-01'), { nonNullable: true });
      expect(component.validate(control)).toEqual({ inputDateMinInvalid: { minDate } });
    });

    it('should return null when value equals minDate', () => {
      const minDate = new Date('2021-06-01');
      fixture.componentRef.setInput('minDate', minDate);
      const control = new FormControl(new Date('2021-06-01'), { nonNullable: true });
      expect(component.validate(control)).toBeNull();
    });

    it('should return null when minDate is not set', () => {
      const control = new FormControl(new Date('2021-05-01'), { nonNullable: true });
      expect(component.validate(control)).toBeNull();
    });
  });
});
