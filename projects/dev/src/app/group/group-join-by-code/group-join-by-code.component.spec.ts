import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupJoinByCodeComponent } from './group-join-by-code.component';

describe('GroupJoinByCodeComponent', () => {
  let component: GroupJoinByCodeComponent;
  let fixture: ComponentFixture<GroupJoinByCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupJoinByCodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupJoinByCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
