import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftHeaderComponent } from './left-header.component';
import { AppModule } from '../../app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

describe('LeftHeaderComponent', () => {
  let component: LeftHeaderComponent;
  let fixture: ComponentFixture<LeftHeaderComponent>;
  let router: Router;

  beforeEach(waitForAsync(() => {
    const routerSpy = jasmine.createSpyObj<Router>('Router', [ 'navigateByUrl' ]);
    TestBed.configureTestingModule({
      declarations: [ LeftHeaderComponent ],
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
    fixture = TestBed.createComponent(LeftHeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(router).toBeDefined();
  });
});
