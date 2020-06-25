import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillActivityTabsComponent } from './skill-activity-tabs.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SkillActivityTabsComponent', () => {
  let component: SkillActivityTabsComponent;
  let fixture: ComponentFixture<SkillActivityTabsComponent>;
  const mockSkills = {
    title: 'Algorithmic skills',
    data: [
      {
        ID: 12,
        title: 'Graphs: methods',
        type: 'leaf',
        ring: false,
        state: 'started',
        progress: {
          displayedScore: 100,
          currentScore: 100
        }
      },
      {
        ID: 13,
        title: 'List graph caracteristics',
        type: 'leaf',
        ring: false,
        state: 'never opened',
        progress: {
          displayedScore: 0,
          currentScore: 0
        }
      }
    ]
  };

  const mockActivities = {
    title: 'My Activities',
    data: [
      {
        ID: 26,
        title: 'Activities to test mosaic/list modes',
        type: 'folder',
        ring: true,
        state: 'never opened',
        progress: {
          displayedScore: 0,
          currentScore: 0
        },
        children: [
          {
            ID: 42,
            title: 'Activity with session list',
            type: 'leaf',
            ring: true,
            state: 'opened',
            hasKey: true,
            progress: {
              displayedScore: 30,
              currentScore: 30
            },
            category: {
              icon: 'fa fa-book-open',
              type: 1
            }
          },
          {
            ID: 43,
            title: 'Activity with mosaic view',
            type: 'leaf',
            ring: true,
            state: 'opened',
            hasKey: true,
            progress: {
              displayedScore: 20,
              currentScore: 30
            },
            category: {
              icon: 'fa fa-book-open',
              type: 1
            }
          }
        ],
        category: {
          icon: 'fa fa-book-open',
          type: 0
        }
      },
      {
        ID: 37,
        title: 'Activities to test headers',
        type: 'folder',
        ring: true,
        state: 'opened',
        progress: {
          displayedScore: 20,
          currentScore: 20
        },
        children: [
          {
            ID: 38,
            title: 'Activity with access code',
            type: 'leaf',
            ring: true,
            state: 'opened',
            hasKey: true,
            progress: {
              displayedScore: 30,
              currentScore: 30
            },
            category: {
              icon: 'fa fa-book-open',
              type: 1
            }
          },
          {
            ID: 39,
            title: 'Before you start notice',
            type: 'leaf',
            ring: true,
            state: 'opened',
            hasKey: true,
            progress: {
              displayedScore: 20,
              currentScore: 30
            },
            category: {
              icon: 'fa fa-book-open',
              type: 1
            }
          }
        ]
      }
    ]
  };

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
    component.skills = mockSkills;
    component.activities = mockActivities;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
