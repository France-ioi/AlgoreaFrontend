import { TestBed } from '@angular/core/testing';

import { GroupTabService } from './group-tab.service';

describe('GroupTabService', () => {
  let service: GroupTabService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupTabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
