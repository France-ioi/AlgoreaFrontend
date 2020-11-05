import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationTabsComponent } from './navigation-tabs.component';
import { AppModule } from '../../../core/app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { CurrentUserService } from 'src/app/shared/services/current-user.service';
import { UserProfile } from 'src/app/shared/http-services/current-user.service';

describe('NavigationTabsComponent', () => {
  let component: NavigationTabsComponent;
  let fixture: ComponentFixture<NavigationTabsComponent>;
  let currentUser: BehaviorSubject<UserProfile|undefined>;

  beforeEach(waitForAsync(() => {
    currentUser = new BehaviorSubject<UserProfile|undefined>(undefined);
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: CurrentUserService,
          useValue: {
            currentUser$: currentUser.asObservable()
          }
        },
        {
          provide: CurrentContentService,
          useValue: {
            currentContent$: of(null)
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
      return (element.textContent || '').trim().replace(/\s+/g, ' ');
    }

    it('should display loading when no user defined', () => {
      expect(userString()).toEqual('Loading...');
    });

    it('should display the full information correctly when firstname is null', () => {
      component.currentUser = { id: '1', login: 'mylogin', firstname: null, lastname: 'myname', isTemp: false };
      expect(userString()).toEqual('myname (mylogin)');
    });

    it('should display the full information correctly when lastname is null', () => {
      component.currentUser = { id: '1', login: 'mylogin', firstname: 'myfirst', lastname: null, isTemp: false };
      expect(userString()).toEqual('myfirst (mylogin)');
    });

    it('should display the full information correctly when firstname is empty', () => {
      component.currentUser = { id: '1', login: 'mylogin', firstname: '', lastname: 'myname', isTemp: false };
      expect(userString()).toEqual('myname (mylogin)');
    });

    it('should display only login when both firstname and lastname are null', () => {
      component.currentUser = { id: '1', login: 'mylogin', firstname: null, lastname: null, isTemp: false };
      expect(userString()).toEqual('mylogin');
    });

    it('should display only login when both firstname and lastname are empty', () => {
      component.currentUser = { id: '1', login: 'mylogin', firstname: '', lastname: '', isTemp: false };
      expect(userString()).toEqual('mylogin');
    });
  });

});
