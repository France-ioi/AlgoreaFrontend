import { TestBed } from '@angular/core/testing';

import { GetRequestsService } from './get-requests.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GetRequestsService', () => {
  let service: GetRequestsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(GetRequestsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
