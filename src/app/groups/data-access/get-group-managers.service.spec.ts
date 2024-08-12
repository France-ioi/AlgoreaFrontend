import { TestBed } from '@angular/core/testing';

import { GetGroupManagersService } from './get-group-managers.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GetGroupManagersService', () => {
  let service: GetGroupManagersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(GetGroupManagersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
