import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { ObservationBarComponent } from './observation-bar.component';
import { fromObservation } from 'src/app/store/observation';
import { fromItemContent } from 'src/app/items/store';
import { ItemRouter } from 'src/app/models/routing/item-router';

describe('ObservationBarComponent', () => {
  let component: ObservationBarComponent;
  let fixture: ComponentFixture<ObservationBarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ ObservationBarComponent ],
      providers: [
        provideMockStore({
          selectors: [
            { selector: fromObservation.selectObservedGroupInfo, value: null },
            { selector: fromObservation.selectActiveContentIsBeingObserved, value: false },
            { selector: fromItemContent.selectActiveContentRoute, value: null },
          ],
        }),
        { provide: ItemRouter, useValue: { navigateTo: jasmine.createSpy('navigateTo') } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObservationBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept signal inputs', () => {
    fixture.componentRef.setInput('caption', 'Watching');
    fixture.componentRef.setInput('onlyIcon', true);
    fixture.componentRef.setInput('showTooltip', true);
    fixture.detectChanges();

    expect(component.caption()).toBe('Watching');
    expect(component.onlyIcon()).toBeTrue();
    expect(component.showTooltip()).toBeTrue();
  });
});
