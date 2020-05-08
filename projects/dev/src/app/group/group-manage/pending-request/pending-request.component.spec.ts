import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRequestComponent } from './pending-request.component';

describe('PendingRequestComponent', () => {
  let component: PendingRequestComponent;
  let fixture: ComponentFixture<PendingRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
