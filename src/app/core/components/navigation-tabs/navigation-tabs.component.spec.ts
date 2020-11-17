import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationTabsComponent } from './navigation-tabs.component';
import { AppModule } from '../../../core/app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('NavigationTabsComponent', () => {
  let component: NavigationTabsComponent;
  let fixture: ComponentFixture<NavigationTabsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        RouterTestingModule
      ],
      providers: [],
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
      component.session = { user: { id: '1', login: 'mylogin', firstName: null, lastName: 'myname', isTemp: false } };
      expect(userString()).toEqual('myname (mylogin)');
    });

    it('should display the full information correctly when lastname is null', () => {
      component.session = { user: { id: '1', login: 'mylogin', firstName: 'myfirst', lastName: null, isTemp: false } };
      expect(userString()).toEqual('myfirst (mylogin)');
    });

    it('should display the full information correctly when firstname is empty', () => {
      component.session = { user: { id: '1', login: 'mylogin', firstName: '', lastName: 'myname', isTemp: false } };
      expect(userString()).toEqual('myname (mylogin)');
    });

    it('should display only login when both firstname and lastname are null', () => {
      component.session = { user: { id: '1', login: 'mylogin', firstName: null, lastName: null, isTemp: false } };
      expect(userString()).toEqual('mylogin');
    });

    it('should display only login when both firstname and lastname are empty', () => {
      component.session = { user: { id: '1', login: 'mylogin', firstName: '', lastName: '', isTemp: false } };
      expect(userString()).toEqual('mylogin');
    });
  });

});
