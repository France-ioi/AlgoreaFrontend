import { TestBed } from '@angular/core/testing';

import { ItemNavigationService } from './item-navigation.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ItemNavigationService', () => {
  let service: ItemNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(ItemNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
