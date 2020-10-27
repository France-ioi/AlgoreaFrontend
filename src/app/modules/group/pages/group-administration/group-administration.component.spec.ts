import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAdministrationComponent } from './group-administration.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { mockGroup } from '../../mocks/group-by-id';
import { of } from 'rxjs';
import { readyState } from 'src/app/shared/helpers/state';

describe('GroupAdministrationComponent', () => {
  let component: GroupAdministrationComponent;
  let fixture: ComponentFixture<GroupAdministrationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ GroupAdministrationComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [{ provide: GroupDataSource, useValue: {
        group$: of(readyState(mockGroup))
      } }]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupAdministrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
