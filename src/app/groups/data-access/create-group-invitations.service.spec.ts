import { TestBed } from '@angular/core/testing';

import { CreateGroupInvitationsService } from './create-group-invitations.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CreateGroupInvitationsService', () => {
  let service: CreateGroupInvitationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(CreateGroupInvitationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
