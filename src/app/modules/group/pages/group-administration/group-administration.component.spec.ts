import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAdministrationComponent } from './group-administration.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { mockGroup } from '../../mocks/group-by-id';

describe('GroupAdministrationComponent', () => {
  let component: GroupAdministrationComponent;
  let fixture: ComponentFixture<GroupAdministrationComponent>;
  const groupTabService = new GroupTabService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ GroupAdministrationComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [ { provide: GroupTabService, useValue: groupTabService } ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    groupTabService.group$.next(mockGroup);
    fixture = TestBed.createComponent(GroupAdministrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
