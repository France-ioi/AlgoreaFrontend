import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupPendingRequestComponent } from './group-pending-request.component';

describe('GroupPendingRequestComponent', () => {
  let component: GroupPendingRequestComponent;
  let fixture: ComponentFixture<GroupPendingRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupPendingRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupPendingRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
