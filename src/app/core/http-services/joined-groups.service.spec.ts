import { TestBed } from '@angular/core/testing';

import { JoinedGroupsService } from './joined-groups.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('JoinedGroupsService', () => {
  let service: JoinedGroupsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(JoinedGroupsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
