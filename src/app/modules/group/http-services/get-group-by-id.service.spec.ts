import { TestBed } from '@angular/core/testing';

import { GetGroupByIdService } from './get-group-by-id.service';

describe('GetGroupByIdService', () => {
  let service: GetGroupByIdService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetGroupByIdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
