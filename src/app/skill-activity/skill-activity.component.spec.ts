import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillActivityComponent } from './skill-activity.component';

describe('SkillActivityComponent', () => {
  let component: SkillActivityComponent;
  let fixture: ComponentFixture<SkillActivityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SkillActivityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
