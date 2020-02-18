import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRequestViewComponent } from './pending-request-view.component';

describe('PendingRequestViewComponent', () => {
  let component: PendingRequestViewComponent;
  let fixture: ComponentFixture<PendingRequestViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingRequestViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingRequestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
