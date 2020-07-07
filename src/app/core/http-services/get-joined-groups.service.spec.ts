import { TestBed } from '@angular/core/testing';

import { GetJoinedGroupsService } from './get-joined-groups.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GetJoinedGroupsService', () => {
  let service: GetJoinedGroupsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(GetJoinedGroupsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
