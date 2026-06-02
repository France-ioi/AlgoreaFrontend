import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ItemLeftNavIconSelectComponent } from './item-left-nav-icon-select.component';

@Component({
  template: `
    <alg-item-left-nav-icon-select
      [formControl]="control"
      [defaultIcon]="'file-text'"
    ></alg-item-left-nav-icon-select>
  `,
  imports: [ ReactiveFormsModule, ItemLeftNavIconSelectComponent ],
})
class HostComponent {
  control = new FormControl('', { nonNullable: true });
}

describe('ItemLeftNavIconSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ HostComponent ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should write an empty value as the default selection', () => {
    const defaultBtn = fixture.debugElement.query(By.css('[aria-label="Default icon"]')).nativeElement as HTMLButtonElement;
    expect(defaultBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('should update the form control when a custom icon is selected', () => {
    const puzzleBtn = fixture.debugElement.query(By.css('[aria-label="puzzle piece"]')).nativeElement as HTMLButtonElement;
    puzzleBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('puzzle-piece');
    expect(puzzleBtn.getAttribute('aria-checked')).toBe('true');
  });
});
