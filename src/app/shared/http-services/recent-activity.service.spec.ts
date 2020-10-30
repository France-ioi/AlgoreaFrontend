import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RecentActivityService } from './recent-activity.service';

describe('RecentActivityService', () => {
  let service: RecentActivityService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(RecentActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
