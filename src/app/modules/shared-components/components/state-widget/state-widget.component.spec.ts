import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateWidgetComponent } from './state-widget.component';

describe('StateWidgetComponent', () => {
  let component: StateWidgetComponent;
  let fixture: ComponentFixture<StateWidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StateWidgetComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
