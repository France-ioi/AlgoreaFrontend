import { TestBed } from '@angular/core/testing';

import { CreateGroupInvitationsService } from './create-group-invitations.service';

describe('CreateGroupInvitationsService', () => {
  let service: CreateGroupInvitationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreateGroupInvitationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
