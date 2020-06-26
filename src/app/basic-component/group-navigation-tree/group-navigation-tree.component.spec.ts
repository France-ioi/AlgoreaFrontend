import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNavigationTreeComponent } from './group-navigation-tree.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

describe('GroupNavigationTreeComponent', () => {
  let component: GroupNavigationTreeComponent;
  let fixture: ComponentFixture<GroupNavigationTreeComponent>;

  beforeEach(async(() => {
    const routerSpy = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
    TestBed.configureTestingModule({
      declarations: [ GroupNavigationTreeComponent ],
      providers: [
        {
          provide: Router,
          useValue: routerSpy
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupNavigationTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
