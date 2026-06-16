import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelativeTimeComponent } from './relative-time.component';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { MINUTES } from 'src/app/utils/duration';
import { LocaleService } from 'src/app/services/localeService';
import { By } from '@angular/platform-browser';

@Component({
  template: '<alg-relative-time [value]="value()" />',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ RelativeTimeComponent ],
})
class TestHostComponent {
  value = signal<string | Date>(new Date());
}

function textContent(fixture: ComponentFixture<TestHostComponent>): string {
  return (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
}

describe('RelativeTimeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ TestHostComponent ],
      providers: [
        { provide: LocaleService, useValue: { currentLang: { tag: 'en' } } },
      ],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    fixture.detectChanges();
    const comp = fixture.debugElement.query(By.directive(RelativeTimeComponent));
    expect(comp).toBeTruthy();
  });

  it('should display "Just now" for a recent date', () => {
    host.value.set(new Date());
    fixture.detectChanges();
    expect(textContent(fixture)).toBe('Just now');
  });

  // jasmine.clock(): patches Date.now() and setInterval together for auto-refresh tests.
  it('should auto-update from "Just now" to "1 minute ago"', () => {
    jasmine.clock().install();
    try {
      const baseDate = new Date();
      jasmine.clock().mockDate(baseDate);

      host.value.set(baseDate);
      fixture.detectChanges();
      expect(textContent(fixture)).toBe('Just now');

      jasmine.clock().tick(MINUTES + 1);
      fixture.detectChanges();
      expect(textContent(fixture)).toBe('1 minute ago');
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
