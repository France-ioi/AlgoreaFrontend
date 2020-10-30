import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOverviewComponent } from './group-overview.component';
import { AppModule } from '../../../../core/app.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { mockGroup } from '../../mocks/group-by-id';
import { of } from 'rxjs';
import { readyState } from 'src/app/shared/helpers/state';

describe('GroupOverviewComponent', () => {
  let component: GroupOverviewComponent;
  let fixture: ComponentFixture<GroupOverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        HttpClientTestingModule
      ],
      declarations: [ GroupOverviewComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [{ provide: GroupDataSource, useValue: {
        group$: of(readyState(mockGroup))
      } }]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
