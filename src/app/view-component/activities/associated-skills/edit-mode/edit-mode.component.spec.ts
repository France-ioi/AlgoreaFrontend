import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociatedSkillsEditModeComponent } from './edit-mode.component';

describe('AssociatedSkillsEditModeComponent', () => {
  let component: AssociatedSkillsEditModeComponent;
  let fixture: ComponentFixture<AssociatedSkillsEditModeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssociatedSkillsEditModeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociatedSkillsEditModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
