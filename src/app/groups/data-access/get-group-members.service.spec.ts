import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APPCONFIG } from 'src/app/config';
import { GetGroupMembersService } from './get-group-members.service';

describe('GetGroupMembersService', () => {
  let service: GetGroupMembersService;
  let http: HttpTestingController;
  const apiUrl = 'http://mock.api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl } },
      ],
    });
    service = TestBed.inject(GetGroupMembersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('parses a member without the retired user grade', () => {
    let gradePresent = true;
    service.getGroupMembers('13').subscribe(members => {
      gradePresent = Object.keys(members[0]?.user ?? {}).includes('grade');
      expect(members[0]?.user).toEqual({
        groupId: '51',
        login: 'billg',
        firstName: 'Bill',
        lastName: 'Gates',
      });
    });

    http.expectOne(`${apiUrl}/groups/13/members`).flush([
      {
        id: '51',
        user: {
          group_id: '51',
          login: 'billg',
          first_name: 'Bill',
          last_name: 'Gates',
          grade: null,
        },
      },
    ]);

    expect(gradePresent).toBeFalse();
  });
});
