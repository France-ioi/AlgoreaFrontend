import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDetailsComponent } from './group-details.component';
import { GroupDataSource } from '../../services/group-datasource.service';
import { mockGroup } from '../../mocks/group-by-id';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GetGroupByIdService } from '../../http-services/get-group-by-id.service';
import { readyState } from 'src/app/shared/helpers/state';

describe('GroupDetailsComponent', () => {
  let component: GroupDetailsComponent;
  let fixture: ComponentFixture<GroupDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupDetailsComponent ],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: {
          paramMap: of({
            get: (_s: string) => '',
          }),
        } },
        { provide: GroupDataSource, useValue: {
          group$: of(readyState(mockGroup))
        } },
        { provide: GetGroupByIdService, useValue: {
          get: (_id: string) => of({})
        } }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
