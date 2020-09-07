import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDetailsComponent } from './group-details.component';
import { GroupTabService } from '../../services/group-tab.service';
import { mockGroup } from '../../mocks/group-by-id';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GroupDetailsComponent', () => {
  let component: GroupDetailsComponent;
  let fixture: ComponentFixture<GroupDetailsComponent>;
  const groupTabService = new GroupTabService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupDetailsComponent ],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: GroupTabService, useValue: groupTabService },
        { provide: ActivatedRoute, useValue: {
          paramMap: of({
            get: (_s: string) => '30'
          })
        }}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    groupTabService.group$.next(mockGroup);
    fixture = TestBed.createComponent(GroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
