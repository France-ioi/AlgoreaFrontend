import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelativeTimeComponent } from './relative-time.component';
import { Component, signal } from '@angular/core';
import { MINUTES } from 'src/app/utils/duration';
import { LocaleService } from 'src/app/services/localeService';
import { By } from '@angular/platform-browser';

@Component({
  template: '<alg-relative-time [value]="value()" />',
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

  // We use jasmine.clock() (not fakeAsync + tick) on purpose: zone.js 0.16's fakeAsync does NOT
  // patch Date.now() by default, but formatRelativeTime computes the delta with `Date.now()`.
  // jasmine.clock().mockDate() + .tick() patches Date AND setInterval together, so the component
  // sees both fake time and fake interval firings.
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
