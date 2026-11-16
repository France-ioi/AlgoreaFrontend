import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { APPCONFIG } from 'src/app/config';
import { TaskTokenService } from './task-token.service';

describe('TaskTokenService', () => {
  let service: TaskTokenService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl: 'http://api.test' } },
      ],
    });
    service = TestBed.inject(TaskTokenService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('generateForObservedUser posts to the observed-user task-token endpoint', () => {
    let token: string | undefined;
    service.generateForObservedUser('10', '20', '3').subscribe(value => {
      token = value;
    });

    const request = http.expectOne(
      'http://api.test/items/10/participant/20/attempts/3/generate-task-token',
    );
    expect(request.request.method).toBe('POST');
    request.flush({ success: true, message: 'created', data: { task_token: 'observed-token' } });
    expect(token).toBe('observed-token');
  });
});
