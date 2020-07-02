import { TestBed } from '@angular/core/testing';

import { GetGroupByIdService } from './get-group-by-id.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GetGroupByIdService', () => {
  let service: GetGroupByIdService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(GetGroupByIdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
