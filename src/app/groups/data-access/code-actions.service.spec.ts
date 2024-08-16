import { TestBed } from '@angular/core/testing';

import { CodeActionsService } from './code-actions.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CodeActionsService', () => {
  let service: CodeActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(CodeActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
