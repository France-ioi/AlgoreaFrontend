import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressSectionComponent } from './progress-section.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProgressSectionComponent', () => {
  let component: ProgressSectionComponent;
  let fixture: ComponentFixture<ProgressSectionComponent>;
  const mockData = {
    header: {
      icon: 'fa fa-eye',
      title: 'Default access',
    },
    progress: true,
    values: [
      {
        field: 'none',
        label: 'Locked and hidden',
        comment:
          'Child is initially invisible to users who get content access to the chapter',
      },
      {
        field: 'as_info',
        label: 'Locked',
        comment:
          'Child is initially visible but locked to users who get content access to the chapter',
      },
      {
        field: 'as_content',
        label: 'Open',
        comment:
          'Child is accessible to users who get content access to the chaptert',
      },
    ],
    name: 'content_view_propagation',
    active_until: 2,
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgressSectionComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressSectionComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
