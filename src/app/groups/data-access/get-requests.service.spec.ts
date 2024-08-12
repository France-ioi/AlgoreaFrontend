import { TestBed } from '@angular/core/testing';

import { GetRequestsService } from './get-requests.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GetRequestsService', () => {
  let service: GetRequestsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(GetRequestsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
