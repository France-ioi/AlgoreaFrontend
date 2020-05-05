import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivitySkillListComponent } from './activity-skill-list.component';

describe('ActivitySkillListComponent', () => {
  let component: ActivitySkillListComponent;
  let fixture: ComponentFixture<ActivitySkillListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivitySkillListComponent ]
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
