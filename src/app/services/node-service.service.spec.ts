import { TestBed } from '@angular/core/testing';

import { NodeServiceService } from './node-service.service';

describe('NodeServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NodeServiceService = TestBed.get(NodeServiceService);
    expect(service).toBeTruthy();
  });
});
