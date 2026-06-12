import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskLoaderComponent } from './task-loader.component';
import { SECONDS } from 'src/app/utils/duration';


describe('TaskLoaderComponent', () => {
  let fixture: ComponentFixture<TaskLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TaskLoaderComponent ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  // jasmine.clock() (not fakeAsync + tick): zone.js 0.16 fakeAsync does not advance RxJS timer().
  it('should show delayed label after delay', () => {
    jasmine.clock().install();
    try {
      fixture = TestBed.createComponent(TaskLoaderComponent);
      fixture.componentRef.setInput('delayedLabel', 'Please wait...');
      fixture.componentRef.setInput('delay', 1);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(fixture.componentInstance.showDelayedLabel()).toBe(false);
      jasmine.clock().tick(SECONDS);
      expect(fixture.componentInstance.showDelayedLabel()).toBe(true);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
