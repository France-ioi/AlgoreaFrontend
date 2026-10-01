import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { CanEnterComponent } from './can-enter.component';

describe('CanEnterComponent', () => {
  let fixture: ComponentFixture<CanEnterComponent>;
  let component: CanEnterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CanEnterComponent ],
      providers: [
        { provide: NgControl, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CanEnterComponent);
    component = fixture.componentInstance;
  });

  it('shows a DST-aware timezone abbreviation per date control', () => {
    spyOn(Intl, 'DateTimeFormat').and.returnValue({
      formatToParts: (date: Date) => [ {
        type: 'timeZoneName',
        value: date.getUTCMonth() < 3 ? 'CET' : 'CEST',
      } ],
    } as unknown as Intl.DateTimeFormat);

    component.writeValue({
      canEnterFrom: new Date('2024-01-15T10:00:00Z'),
      canEnterUntil: new Date('2024-06-15T10:00:00Z'),
    });
    fixture.detectChanges();

    const fromTz = fixture.debugElement.query(By.css('[data-testid="can-enter-from-time-zone"]'));
    const untilTz = fixture.debugElement.query(By.css('[data-testid="can-enter-until-time-zone"]'));
    expect(fromTz.nativeElement.textContent.trim()).toBe('CET');
    expect(untilTz.nativeElement.textContent.trim()).toBe('CEST');
  });

  it('renders empty timezone abbreviations when From and Until are null', () => {
    fixture.detectChanges();

    const fromTz = fixture.debugElement.query(By.css('[data-testid="can-enter-from-time-zone"]'));
    const untilTz = fixture.debugElement.query(By.css('[data-testid="can-enter-until-time-zone"]'));
    expect(fromTz.nativeElement.textContent.trim()).toBe('');
    expect(untilTz.nativeElement.textContent.trim()).toBe('');
  });

  it('shows the timezone note without a parenthetical abbreviation', () => {
    component.writeValue({
      canEnterFrom: new Date('2024-01-15T10:00:00Z'),
      canEnterUntil: new Date('2024-06-15T10:00:00Z'),
    });
    fixture.detectChanges();

    const note = fixture.debugElement.query(By.css('.note'));
    expect(note.nativeElement.textContent.trim()).toBe('The time is entered in your own timezone.');
    expect(note.nativeElement.textContent).not.toContain('(');
  });
});
