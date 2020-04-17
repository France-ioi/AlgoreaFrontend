import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupJoinedComponent } from './group-joined.component';

describe('GroupJoinedComponent', () => {
  let component: GroupJoinedComponent;
  let fixture: ComponentFixture<GroupJoinedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupJoinedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupJoinedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
