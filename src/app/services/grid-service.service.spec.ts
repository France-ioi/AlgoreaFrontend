import { TestBed } from '@angular/core/testing';

import { GridServiceService } from './grid-service.service';

describe('GridServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GridServiceService = TestBed.get(GridServiceService);
    expect(service).toBeTruthy();
  });
});
