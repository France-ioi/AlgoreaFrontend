import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSettingsComponent } from './group-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { mockGroup } from '../../mocks/group-by-id';
import { readyState } from 'src/app/shared/helpers/state';
import { of } from 'rxjs';

describe('GroupSettingsComponent', () => {
  let component: GroupSettingsComponent;
  let fixture: ComponentFixture<GroupSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ GroupSettingsComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [{ provide: GroupDataSource, useValue: {
        group$: of(readyState(mockGroup))
      } }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
