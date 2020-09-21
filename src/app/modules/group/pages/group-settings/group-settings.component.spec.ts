import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSettingsComponent } from './group-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { mockGroup } from '../../mocks/group-by-id';

describe('GroupSettingsComponent', () => {
  let component: GroupSettingsComponent;
  let fixture: ComponentFixture<GroupSettingsComponent>;
  const groupTabService = new GroupTabService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ GroupSettingsComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [ { provide: GroupTabService, useValue: groupTabService } ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    groupTabService.setGroup(mockGroup);
    fixture = TestBed.createComponent(GroupSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
