import { TestBed } from '@angular/core/testing';

import { GroupActionsService } from './group-actions.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GroupActionsService', () => {
  let service: GroupActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(GroupActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
