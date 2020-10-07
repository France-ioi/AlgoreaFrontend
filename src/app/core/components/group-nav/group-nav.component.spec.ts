import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNavComponent } from './group-nav.component';
import { JoinedGroupsService } from '../../http-services/joined-groups.service';
import { ManagedGroupsService } from '../../http-services/managed-groups.service';
import { Router } from '@angular/router';

describe('GroupNavComponent', () => {
  let component: GroupNavComponent;
  let fixture: ComponentFixture<GroupNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupNavComponent ],
      providers: [
        { provide: JoinedGroupsService, useValue: {} },
        { provide: ManagedGroupsService, useValue: {} },
        { provide: Router, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
