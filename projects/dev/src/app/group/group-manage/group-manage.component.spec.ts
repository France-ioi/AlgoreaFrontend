import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupManageComponent } from './group-manage.component';
import { GroupHeaderComponent } from '../group-header/group-header.component';
import { PendingRequestComponent } from './pending-request/pending-request.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GroupManageComponent', () => {
  let component: GroupManageComponent;
  let fixture: ComponentFixture<GroupManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupManageComponent, GroupHeaderComponent, PendingRequestComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
