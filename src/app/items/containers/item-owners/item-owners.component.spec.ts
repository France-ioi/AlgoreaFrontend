import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { CurrentUserProfile } from 'src/app/data-access/current-user.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemOwnersComponent } from './item-owners.component';

const apiUrl = 'http://test.api';
const itemId = 'item-42';
const ownersUrl = `${apiUrl}/items/${itemId}/owners`;

function mockCurrentUser(groupId: string): CurrentUserProfile {
  return {
    groupId,
    login: 'current',
    profile: {},
    defaultLanguage: 'en',
    tempUser: false,
  };
}

describe('ItemOwnersComponent', () => {
  let fixture: ComponentFixture<ItemOwnersComponent>;
  let httpTesting: HttpTestingController;

  async function setup(currentUserGroupId: string): Promise<void> {
    const profile = mockCurrentUser(currentUserGroupId);

    await TestBed.configureTestingModule({
      imports: [ ItemOwnersComponent ],
      providers: [
        { provide: APPCONFIG, useValue: { apiUrl } },
        {
          provide: UserSessionService,
          useValue: { session$: new BehaviorSubject(profile) },
        },
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ItemOwnersComponent);
    fixture.componentRef.setInput('itemId', itemId);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpTesting.verify();
  });

  function expectOwnersRequest(): ReturnType<HttpTestingController['expectOne']> {
    const req = httpTesting.expectOne(ownersUrl);
    expect(req.request.method).toBe('GET');
    return req;
  }

  async function flushOwnersAndStabilize(body: object | object[]): Promise<void> {
    expectOwnersRequest().flush(body);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('requests owners for the given item id', async () => {
    await setup('user-99');
    expectOwnersRequest().flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows loading then renders linked owners', async () => {
    await setup('user-99');

    expect(fixture.debugElement.query(By.directive(LoadingComponent))).toBeTruthy();

    await flushOwnersAndStabilize([
      { id: '25', name: 'some class', type: 'Class' },
      { id: '10', name: 'Team Alpha', type: 'Team' },
    ]);

    const links = fixture.debugElement.queryAll(By.css('a.alg-link'));
    expect(links.length).toBe(2);
    expect(links[0]!.nativeElement.textContent.trim()).toBe('some class');
    expect(links[1]!.nativeElement.textContent.trim()).toBe('Team Alpha');
    expect(fixture.nativeElement.textContent).toContain('The owners of this content are:');
  });

  it('shows empty state when there are no owners', async () => {
    await setup('user-99');
    await flushOwnersAndStabilize([]);

    expect(fixture.nativeElement.textContent).toContain('No owners.');
    expect(fixture.debugElement.queryAll(By.css('a.alg-link')).length).toBe(0);
  });

  it('shows error with retry and refetches on retry', async () => {
    await setup('user-99');
    expectOwnersRequest().flush('Server error', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(ErrorComponent))).toBeTruthy();

    const retryButton = fixture.debugElement.query(By.css('.refresh-button'));
    retryButton.nativeElement.click();
    fixture.detectChanges();

    await flushOwnersAndStabilize([ { id: '25', name: 'Recovered owner', type: 'Class' } ]);

    expect(fixture.nativeElement.textContent).toContain('Recovered owner');
  });

  it('filters current user from links and appends yourself', async () => {
    await setup('user-1');
    await flushOwnersAndStabilize([
      { id: 'user-1', name: 'Current User Group', type: 'User' },
      { id: '25', name: 'some class', type: 'Class' },
    ]);

    const links = fixture.debugElement.queryAll(By.css('a.alg-link'));
    expect(links.length).toBe(1);
    expect(links[0]!.nativeElement.textContent.trim()).toBe('some class');
    expect(fixture.nativeElement.textContent).toContain('yourself');
    expect(fixture.nativeElement.textContent).not.toContain('Current User Group');
  });

  it('uses singular sentence for one owner', async () => {
    await setup('user-99');
    await flushOwnersAndStabilize([ { id: '25', name: 'Owner', type: 'Class' } ]);

    expect(fixture.nativeElement.textContent).toContain('The owner of this content is:');
    expect(fixture.nativeElement.textContent).not.toContain('The owners of this content are:');
  });

  it('uses plural sentence for multiple owners', async () => {
    await setup('user-99');
    await flushOwnersAndStabilize([
      { id: '25', name: 'A', type: 'Class' },
      { id: '10', name: 'B', type: 'Team' },
    ]);

    expect(fixture.nativeElement.textContent).toContain('The owners of this content are:');
  });

  it('uses singular sentence when only yourself is owner', async () => {
    await setup('user-1');
    await flushOwnersAndStabilize([ { id: 'user-1', name: 'Me', type: 'User' } ]);

    expect(fixture.nativeElement.textContent).toContain('The owner of this content is:');
    expect(fixture.nativeElement.textContent).toContain('yourself');
    expect(fixture.debugElement.queryAll(By.css('a.alg-link')).length).toBe(0);
  });
});
