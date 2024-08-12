import { TestBed } from '@angular/core/testing';

import { GetGroupByIdService } from './get-group-by-id.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GetGroupByIdService', () => {
  let service: GetGroupByIdService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(GetGroupByIdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
