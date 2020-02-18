import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillActivityTabsComponent } from './skill-activity-tabs.component';

describe('SkillActivityComponent', () => {
  let component: SkillActivityTabsComponent;
  let fixture: ComponentFixture<SkillActivityTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SkillActivityTabsComponent ]
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
