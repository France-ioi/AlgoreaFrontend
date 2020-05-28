import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupManageComponent } from './group-manage.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('GroupManageComponent', () => {
  let component: GroupManageComponent;
  let fixture: ComponentFixture<GroupManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ GroupManageComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({id: 50})
          }
        },
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
