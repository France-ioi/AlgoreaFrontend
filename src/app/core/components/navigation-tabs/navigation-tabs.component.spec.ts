import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationTabsComponent } from './navigation-tabs.component';
import { AppModule } from '../../../core/app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { CurrentUserService } from 'src/app/shared/services/current-user.service';
import { BehaviorSubject } from 'rxjs';
import { UserProfile } from 'src/app/shared/http-services/current-user.service';
import { By } from '@angular/platform-browser';

describe('NavigationTabsComponent', () => {
  let component: NavigationTabsComponent;
  let fixture: ComponentFixture<NavigationTabsComponent>;
  let currentUser: BehaviorSubject<UserProfile>;

  beforeEach(async(() => {
    currentUser = new BehaviorSubject<UserProfile>(null);
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: CurrentUserService,
          useValue: {
            currentUser: () => currentUser.asObservable()
          }
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // user as string part

  describe('the user part', () => {

    function userString(): string {
      fixture.detectChanges();
      const element = fixture.debugElement.query(By.css('.group-title')).nativeElement as HTMLElement;
      return element.textContent.trim().replace(/\s+/g, ' ');
    }

    it('should display loading when no user defined', () => {
      expect(userString()).toEqual('Loading...');
    });

    it('should display the full information correctly when firstname is null', () => {
      currentUser.next({id: '1', login: 'mylogin', firstname: null, lastname: 'myname', isTemp: false});
      expect(userString()).toEqual('myname (mylogin)');
    });

    it('should display the full information correctly when lastname is null', () => {
      currentUser.next({id: '1', login: 'mylogin', firstname: 'myfirst', lastname: null, isTemp: false});
      expect(userString()).toEqual('myfirst (mylogin)');
    });

    it('should display the full information correctly when firstname is empty', () => {
      currentUser.next({id: '1', login: 'mylogin', firstname: '', lastname: 'myname', isTemp: false});
      expect(userString()).toEqual('myname (mylogin)');
    });

    it('should display only login when both firstname and lastname are null', () => {
      currentUser.next({id: '1', login: 'mylogin', firstname: null, lastname: null, isTemp: false});
      expect(userString()).toEqual('mylogin');
    });

    it('should display only login when both firstname and lastname are empty', () => {
      currentUser.next({id: '1', login: 'mylogin', firstname: '', lastname: '', isTemp: false});
      expect(userString()).toEqual('mylogin');
    });
  });

});
