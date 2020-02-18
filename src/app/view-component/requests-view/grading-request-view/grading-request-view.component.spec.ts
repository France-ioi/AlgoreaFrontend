import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GradingRequestViewComponent } from './grading-request-view.component';

describe('GradingRequestViewComponent', () => {
  let component: GradingRequestViewComponent;
  let fixture: ComponentFixture<GradingRequestViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GradingRequestViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GradingRequestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
