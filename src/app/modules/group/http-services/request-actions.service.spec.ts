import { TestBed } from '@angular/core/testing';

import { RequestActionsService } from './request-actions.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('RequestActionsService', () => {
  let service: RequestActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(RequestActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
