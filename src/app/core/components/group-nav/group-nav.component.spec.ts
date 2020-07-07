import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNavComponent } from './group-nav.component';
import { GetJoinedGroupsService } from '../../http-services/get-joined-groups.service';

describe('GroupNavComponent', () => {
  let component: GroupNavComponent;
  let fixture: ComponentFixture<GroupNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupNavComponent ],
      providers: [
        { provide: GetJoinedGroupsService, useValue: {} },
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
