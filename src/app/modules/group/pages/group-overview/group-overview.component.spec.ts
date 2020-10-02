import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOverviewComponent } from './group-overview.component';
import { AppModule } from '../../../../core/app.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { mockGroup } from '../../mocks/group-by-id';

describe('GroupOverviewComponent', () => {
  let component: GroupOverviewComponent;
  let fixture: ComponentFixture<GroupOverviewComponent>;
  const groupTabService = new GroupTabService();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        HttpClientTestingModule
      ],
      declarations: [ GroupOverviewComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [ { provide: GroupTabService, useValue: groupTabService } ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    groupTabService.setGroup(mockGroup);
    fixture = TestBed.createComponent(GroupOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
