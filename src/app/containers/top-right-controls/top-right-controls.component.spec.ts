import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { TopRightControlsComponent } from './top-right-controls.component';
import { UserSessionService } from '../../services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { APPCONFIG } from 'src/app/config';
import { LanguagePickerComponent } from '../language-picker/language-picker.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { TopRightMenuComponent } from '../top-right-menu/top-right-menu.component';

@Component({ selector: 'alg-language-picker', template: '' })
class StubLanguagePickerComponent {}

@Component({ selector: 'alg-notification-bell', template: '' })
class StubNotificationBellComponent {}

@Component({ selector: 'alg-top-right-menu', template: '' })
class StubTopRightMenuComponent {
  styleClass = input<string>();
}

describe('TopRightControlsComponent', () => {
  let fixture: ComponentFixture<TopRightControlsComponent>;
  const session$ = new BehaviorSubject<undefined>(undefined);

  beforeEach(async () => {
    session$.next(undefined);
    await TestBed.configureTestingModule({
      imports: [ TopRightControlsComponent ],
      providers: [
        {
          provide: UserSessionService,
          useValue: {
            session$,
            login: jasmine.createSpy('login'),
          },
        },
        {
          provide: LocaleService,
          useValue: {
            languages: [ { tag: 'en' } ],
          },
        },
        {
          provide: APPCONFIG,
          useValue: {
            featureFlags: { enableNotifications: false },
          },
        },
      ],
    })
      .overrideComponent(TopRightControlsComponent, {
        remove: {
          imports: [ LanguagePickerComponent, NotificationBellComponent, TopRightMenuComponent ],
        },
        add: {
          imports: [ StubLanguagePickerComponent, StubNotificationBellComponent, StubTopRightMenuComponent ],
        },
      })
      .compileComponents();
  });

  async function render(layout: 'bar' | 'rail'): Promise<void> {
    fixture = TestBed.createComponent(TopRightControlsComponent);
    fixture.componentRef.setInput('layout', layout);
    fixture.detectChanges();
    await firstValueFrom(fixture.componentInstance.session$);
    fixture.detectChanges();
    TestBed.flushEffects();
  }

  it('renders a text Sign in button in bar layout when logged out', async () => {
    await render('bar');

    expect(fixture.debugElement.query(By.css('button[alg-button]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('button[alg-button-icon]'))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sign in');
  });

  it('renders an icon Sign in button in rail layout when logged out', async () => {
    await render('rail');

    expect(fixture.debugElement.query(By.css('button[alg-button-icon]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('button[alg-button]'))).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Sign in');
  });
});
