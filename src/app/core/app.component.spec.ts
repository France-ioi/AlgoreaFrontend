import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { LeftNavComponent } from './components/left-nav/left-nav.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CurrentUserService } from '../shared/services/current-user.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent,
        LeftNavComponent
      ],
      providers: [
        {
          provide: CurrentUserService,
          useValue: {}
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});
