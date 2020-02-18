import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskTabComponent } from './task-tab.component';

describe('TaskTabComponent', () => {
  let component: TaskTabComponent;
  let fixture: ComponentFixture<TaskTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
