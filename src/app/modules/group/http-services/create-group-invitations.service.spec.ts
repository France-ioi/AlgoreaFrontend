import { TestBed } from '@angular/core/testing';

import { CreateGroupInvitationsService } from './create-group-invitations.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CreateGroupInvitationsService', () => {
  let service: CreateGroupInvitationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
    });
    service = TestBed.inject(CreateGroupInvitationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
