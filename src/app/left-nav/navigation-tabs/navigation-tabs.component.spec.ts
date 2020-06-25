import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationTabsComponent } from './navigation-tabs.component';
import { AppModule } from '../app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('NavigationTabsComponent', () => {
  let component: NavigationTabsComponent;
  let fixture: ComponentFixture<NavigationTabsComponent>;
  const mockCurrentUser = {
    ID: 1,
    title: 'Lionel MESSI',
    avatar: '_messi.jpg',
    type: 'user'
  };

  const mockItems = {
    groups: {
      manage: [
        {
          ID: 50,
          title: 'Group 50',
          type: 'leaf',
          icons: 'fa fa-home'
        },
        {
          ID: 51,
          title: 'Group 51',
          type: 'leaf',
          icons: 'fa fa-home'
        }
      ],
      join: [
        {
          title: 'Pictures',
          type: 'folder',
          children: [
            {
              title: 'barcelona.jpg',
              type: 'leaf'
            },
            {
              title: 'logo.jpg',
              type: 'leaf'
            },
            {
              title: 'primeui.png',
              type: 'leaf'
            }
          ]
        },
        {
          title: 'Movies',
          type: 'folder',
          children: [
            {
              title: 'Al Pacino',
              type: 'folder'
            },
            {
              title: 'Robert De Niro',
              type: 'folder'
            }
          ]
        }
      ]
    },
    skills: {
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
    },
    activities: {
      title: 'My Activities',
      data: [
        {
          ID: 26,
          title: 'Activities to test mosaic/list modes',
          type: 'leaf',
          ring: true,
          state: 'never opened',
          progress: {
            displayedScore: 0,
            currentScore: 0
          },
          category: {
            icon: 'fa fa-book-open',
            type: 0
          }
        },
        {
          ID: 37,
          title: 'Activities to test headers',
          type: 'leaf',
          ring: true,
          state: 'opened',
          progress: {
            displayedScore: 20,
            currentScore: 20
          },
        },
      ]
    }
  };

  beforeEach(async(() => {
    const locationSpy = jasmine.createSpyObj('Location', ['back']);
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: Location,
          useClass: locationSpy
        }
      ],
      declarations: [ NavigationTabsComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationTabsComponent);
    component = fixture.componentInstance;
    component.currentUser = mockCurrentUser;
    component.items = mockItems;
    fixture.detectChanges();
  });

  // Test to be fixed !
  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
