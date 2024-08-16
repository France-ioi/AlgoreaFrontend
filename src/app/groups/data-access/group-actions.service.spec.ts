import { TestBed } from '@angular/core/testing';

import { GroupActionsService } from './group-actions.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GroupActionsService', () => {
  let service: GroupActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(GroupActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
