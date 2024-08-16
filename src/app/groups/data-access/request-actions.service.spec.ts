import { TestBed } from '@angular/core/testing';

import { RequestActionsService } from './request-actions.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RequestActionsService', () => {
  let service: RequestActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(RequestActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
