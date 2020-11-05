import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNavTreeComponent } from './group-nav-tree.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

describe('GroupNavTreeComponent', () => {
  let component: GroupNavTreeComponent;
  let fixture: ComponentFixture<GroupNavTreeComponent>;

  beforeEach(waitForAsync(() => {
    const routerSpy = jasmine.createSpyObj<Router>('Router', [ 'parseUrl' ]);
    TestBed.configureTestingModule({
      declarations: [ GroupNavTreeComponent ],
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
    fixture = TestBed.createComponent(GroupNavTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
