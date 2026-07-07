import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

import { CreateGroupInvitationsService, InvitationResult } from './create-group-invitations.service';
import { APPCONFIG } from 'src/app/config';

describe('CreateGroupInvitationsService', () => {
  let service: CreateGroupInvitationsService;
  let httpTestingController: HttpTestingController;

  const apiUrl = 'http://mock.api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl } },
      ],
    });
    service = TestBed.inject(CreateGroupInvitationsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map API status values to InvitationResult', () => {
    const mappingCases: { login: string, apiStatus: string, expected: InvitationResult }[] = [
      { login: 'success-user', apiStatus: 'success', expected: InvitationResult.Success },
      { login: 'unchanged-user', apiStatus: 'unchanged', expected: InvitationResult.AlreadyInvited },
      { login: 'missing-user', apiStatus: 'not_found', expected: InvitationResult.NotFound },
      { login: 'cycle-user', apiStatus: 'cycle', expected: InvitationResult.Error },
      { login: 'member-user', apiStatus: 'invalid', expected: InvitationResult.AlreadyMember },
    ];

    const logins = mappingCases.map(({ login }) => login);
    const data = Object.fromEntries(mappingCases.map(({ login, apiStatus }) => [ login, apiStatus ]));

    let result: Map<string, InvitationResult> | undefined;
    service.createInvitations('group-1', logins).subscribe(res => {
      result = res;
    });

    const req = httpTestingController.expectOne(`${apiUrl}/groups/group-1/invitations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ logins });
    req.flush({ success: true, message: 'ok', data });

    expect(result).toEqual(new Map(mappingCases.map(({ login, expected }) => [ login, expected ])));
  });

  it('should throw when the API returns an unexpected status', () => {
    let error: unknown;
    service.createInvitations('group-1', [ 'user' ]).subscribe({
      error: err => {
        error = err;
      },
    });

    const req = httpTestingController.expectOne(`${apiUrl}/groups/group-1/invitations`);
    req.flush({ success: true, message: 'ok', data: { user: 'unexpected' } });

    expect(error).toEqual(jasmine.any(Error));
    expect((error as Error).message).toContain('unexpected result');
  });
});
