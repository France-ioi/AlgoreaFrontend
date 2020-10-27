import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopNavComponent } from './top-nav.component';
import { AppModule } from '../../../core/app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

describe('TopNavComponent', () => {
  let component: TopNavComponent;
  let fixture: ComponentFixture<TopNavComponent>;
  let router: Router;

  beforeEach(waitForAsync(() => {
    const routerSpy = jasmine.createSpyObj<Router>('Router', [ 'navigateByUrl' ]);
    TestBed.configureTestingModule({
      declarations: [ TopNavComponent ],
      imports: [
        AppModule
      ],
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
    fixture = TestBed.createComponent(TopNavComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(router).toBeDefined();
  });
});
