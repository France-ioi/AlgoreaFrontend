import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivitySkillListComponent } from './activity-skill-list.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

describe('ActivitySkillListComponent', () => {
  let component: ActivitySkillListComponent;
  let fixture: ComponentFixture<ActivitySkillListComponent>;

  beforeEach(async(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      declarations: [ ActivitySkillListComponent ],
      providers: [
        {
          provide: Router,
          useValue: routerSpy
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivitySkillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
