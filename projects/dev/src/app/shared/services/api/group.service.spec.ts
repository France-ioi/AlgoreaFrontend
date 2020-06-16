import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GroupService } from './group.service';

describe('GroupService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
  }));

  it('should be created', () => {
    const service: GroupService = TestBed.inject(GroupService);
    expect(service).toBeTruthy();
  });
});
