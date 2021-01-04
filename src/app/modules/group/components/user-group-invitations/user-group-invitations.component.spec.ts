import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { of, Subject } from 'rxjs';
import { GetRequestsService, PendingRequest } from '../../http-services/get-requests.service';
import { Action, RequestActionsService } from '../../http-services/request-actions.service';
import { UserGroupInvitationsComponent } from './user-group-invitations.component';

const MOCK_RESPONSE: PendingRequest[] = [
  {
    at: null,
    user: { id: '11', login: 'MadameSoso', firstName: 'Marie-Sophie', lastName: 'Denis' },
    group: { id: '501', name: 'Dojo 50' }
  },
  {
    at: null,
    user: { id: '12', login: 'FredGast', firstName: 'Frederique', lastName: 'Gastard' },
    group: { id: '601', name: 'Dojo 50' }
  },
  {
    at: null,
    user: { id: '10', login: 'Jeandu88', firstName: 'Jean', lastName: 'Dujardin' },
    group: { id: '701', name: 'Dojo 50' }
  }
];

describe('UserGroupInvitationsComponent', () => {
  let component: UserGroupInvitationsComponent;
  let fixture: ComponentFixture<UserGroupInvitationsComponent>;
  let requestActionsService: RequestActionsService;
  let getRequestsService: GetRequestsService;
  let messageService: MessageService;
  let serviceResponder$: Subject<Map<string,any>[]>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserGroupInvitationsComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: GetRequestsService, useValue: {
          getGroupInvitations: (_sort: any) => of<PendingRequest[]>(MOCK_RESPONSE),
        } },
        { provide: RequestActionsService, useValue: {
          processGroupInvitations: (_groupId: any[], _action: any) => serviceResponder$.asObservable()
        } },
        { provide: MessageService, useValue: { add: (_m: any) => {} } }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    serviceResponder$ = new Subject<Map<string,any>[]>();
    fixture = TestBed.createComponent(UserGroupInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    requestActionsService = TestBed.inject(RequestActionsService);
    getRequestsService = TestBed.inject(GetRequestsService);
    messageService = TestBed.inject(MessageService);
    spyOn(messageService, 'add').and.callThrough();
    spyOn(getRequestsService, 'getGroupInvitations').and.callThrough();
    spyOn(requestActionsService, 'processGroupInvitations').and.callThrough();
    component.ngOnInit();
  });

  afterEach(() => {
    serviceResponder$.complete();
  });

  it('should load requests at init', () => {
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledWith([]);
    expect(component.requests).toEqual(MOCK_RESPONSE);
    expect(component.currentSort).toEqual([]);
    expect(component.state).toEqual('ready');
  });

  it('should, when sorting is changed, call the service with the appropriate attributes,', () => {

    // mixed orders
    component.onFetch([ 'at' ]);
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledWith([ 'at' ]);

    // check the field precedence counts
    component.onFetch([ '-at' ]);
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledWith([ '-at' ]);

    // sort reset
    component.onFetch([]);
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledWith([]);
  });

  it('should, when accept is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'accept'
    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE[1] ] });

    expect(component.state).toEqual('processing');
    expect(requestActionsService.processGroupInvitations).toHaveBeenCalledWith([ '601' ], Action.Accept);
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next([ new Map([ [ '12', 'success' ] ]) ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(messageService.add).toHaveBeenCalledTimes(1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: '1 request(s) have been accepted',
      life: 5000
    });
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should, when reject is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'reject'
    component.onProcessRequests({ type: Action.Reject, data: [ MOCK_RESPONSE[1] ] });

    expect(component.state).toEqual('processing');
    expect(requestActionsService.processGroupInvitations).toHaveBeenCalledWith([ '601' ], Action.Reject);
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next([ new Map([ [ '12', 'success' ] ]) ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(messageService.add).toHaveBeenCalledTimes(1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: '1 request(s) have been declined',
      life: 5000
    });
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should consider "unchanged" in response as success', () => {
    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE[1] ] });

    serviceResponder$.next([ new Map([ [ '12', 'unchanged' ] ]) ]);
    serviceResponder$.complete();

    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: '1 request(s) have been accepted',
      life: 5000
    });
  });

  it('should display an appropriate message on partial success', () => {

    component.onProcessRequests({ type: Action.Accept, data: MOCK_RESPONSE }); // select 10, 11 and 12

    serviceResponder$.next([
      new Map([ [ '11', 'invalid' ] ]),
      new Map([ [ '12', 'success' ] ]),
      new Map([ [ '10', 'success' ] ]),
    ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(messageService.add).toHaveBeenCalledTimes(1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Partial success',
      detail: '2 request(s) have been accepted, 1 could not be executed',
      life: 5000
    });
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when all accept requests failed', () => {

    component.onProcessRequests({ type: Action.Accept, data: MOCK_RESPONSE }); // select 10, 11 and 12

    serviceResponder$.next([
      new Map([ [ '11', 'invalid' ] ]),
      new Map([ [ '12', 'cycle' ] ]),
    ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(messageService.add).toHaveBeenCalledTimes(1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to accept the selected request(s).',
      life: 5000
    });
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when all reject requests failed', () => {

    component.onProcessRequests({ type: Action.Reject, data: MOCK_RESPONSE }); // select 10, 11 and 12

    serviceResponder$.next([
      new Map([ [ '11', 'invalid' ] ]),
      new Map([ [ '12', 'cycle' ] ]),
    ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(messageService.add).toHaveBeenCalledTimes(1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to reject the selected request(s).',
      life: 5000
    });
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when the service fails', () => {

    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE[1] ] });

    serviceResponder$.error(new Error('...'));
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(messageService.add).toHaveBeenCalledTimes(1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'The action cannot be executed. If the problem persists, contact us.',
      life: 5000
    });
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(1); // service error does not reload content
  });

});
