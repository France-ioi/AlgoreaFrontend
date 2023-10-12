import { TestBed } from '@angular/core/testing';

import { CodeActionsService } from './code-actions.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CodeActionsService', () => {
  let service: CodeActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(CodeActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
