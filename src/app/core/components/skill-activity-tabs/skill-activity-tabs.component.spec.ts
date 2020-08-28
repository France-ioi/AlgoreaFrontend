import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillActivityTabsComponent } from './skill-activity-tabs.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SkillActivityTabsComponent', () => {
  let component: SkillActivityTabsComponent;
  let fixture: ComponentFixture<SkillActivityTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SkillActivityTabsComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillActivityTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
