import { TestBed } from '@angular/core/testing';

import { ItemNavigationService } from './item-navigation.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ItemNavigationService', () => {
  let service: ItemNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
    });
    service = TestBed.inject(ItemNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
