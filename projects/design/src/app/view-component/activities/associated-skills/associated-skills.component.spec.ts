import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociatedSkillsComponent } from './associated-skills.component';

describe('AssociatedSkillsComponent', () => {
  let component: AssociatedSkillsComponent;
  let fixture: ComponentFixture<AssociatedSkillsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssociatedSkillsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociatedSkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
