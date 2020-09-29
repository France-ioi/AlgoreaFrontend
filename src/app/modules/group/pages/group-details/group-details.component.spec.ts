import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDetailsComponent } from './group-details.component';
import { GroupTabService } from '../../services/group-tab.service';
import { mockGroup } from '../../mocks/group-by-id';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GetGroupByIdService } from '../../http-services/get-group-by-id.service';

describe('GroupDetailsComponent', () => {
  let component: GroupDetailsComponent;
  let fixture: ComponentFixture<GroupDetailsComponent>;
  const groupTabService = new GroupTabService();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupDetailsComponent ],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: {
          paramMap: of({
            has: (_s: string) => true,
          }),
          snapshot: {
            paramMap: {
              get: (_s: string) => '30',
            }
          }
        }},
        { provide: GroupTabService, useValue: groupTabService },
        { provide: GetGroupByIdService, useValue: {
          get: (_id: string) => of({})
        }}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    groupTabService.setGroup(mockGroup);
    fixture = TestBed.createComponent(GroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
