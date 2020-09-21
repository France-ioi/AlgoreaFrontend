import { TestBed } from '@angular/core/testing';

import { GetGroupManagersService } from './get-group-managers.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GetGroupManagersService', () => {
  let service: GetGroupManagersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(GetGroupManagersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
