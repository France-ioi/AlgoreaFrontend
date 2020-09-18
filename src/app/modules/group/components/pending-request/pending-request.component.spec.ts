import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRequestComponent, Activity, Action } from './pending-request.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PendingRequest, GetRequestsService } from '../../http-services/get-requests.service';
import { RequestActionsService } from '../../http-services/request-actions.service';

const MOCK_RESPONSE: PendingRequest[] = [
  {
    at: null,
    user: { group_id: '11', login: 'MadameSoso', first_name: 'Marie-Sophie', last_name: 'Denis', grade: 3 },
    group: { id: '50', name: 'Dojo 50' }
  },
  {
    at: null,
    user: { group_id: '12', login: 'FredGast', first_name: 'Frederique', last_name: 'Gastard', grade: 2 },
    group: { id: '50', name: 'Dojo 50' }
  },
  {
    at: null,
    user: { group_id: '10', login: 'Jeandu88', first_name: 'Jean', last_name: 'Dujardin', grade: 3 },
    group: { id: '50', name: 'Dojo 50' }
  }

];

describe('PendingRequestComponent', () => {
  let component: PendingRequestComponent;
  let fixture: ComponentFixture<PendingRequestComponent>;
  let requestActionsService: RequestActionsService;
  let getRequestsService: GetRequestsService;
  let messageService: MessageService;
  let serviceResponder$: Subject<Map<string,any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingRequestComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: GetRequestsService, useValue: {
          getPendingRequests: (_id: any, _sort: any, _includeSubgroup: any) => of<PendingRequest[]>(MOCK_RESPONSE),
        }},
        { provide: RequestActionsService, useValue: {
          acceptJoinRequest: (_id: any, _groupIds: any) => serviceResponder$.asObservable(),
          rejectJoinRequest: (_id: any, _groupIds: any) => serviceResponder$.asObservable(),
        }},
        { provide: MessageService, useValue: { add: (_m: any) => {} } }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    serviceResponder$ = new Subject<Map<string,any>>();
    fixture = TestBed.createComponent(PendingRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    requestActionsService = TestBed.inject(RequestActionsService);
    getRequestsService = TestBed.inject(GetRequestsService);
    messageService = TestBed.inject(MessageService);
    component.groupId = '99';
    spyOn(messageService, 'add').and.callThrough();
    spyOn(getRequestsService, 'getPendingRequests').and.callThrough();
    spyOn(requestActionsService, 'acceptJoinRequest').and.callThrough();
    spyOn(requestActionsService, 'rejectJoinRequest').and.callThrough();
    component.ngOnChanges({});
    component.includeSubgroup = false;
  });

  afterEach(() => {
    serviceResponder$.complete();
  });

  it('should load requests at init', () => {
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledWith('99', [], undefined);
    expect(component.requests).toEqual(MOCK_RESPONSE);
    expect(component.selection).toEqual([]);
    expect(component.panel.length).toEqual(1);
    expect(component.currentSort).toEqual([]);
    expect(component.ongoingActivity).toEqual(Activity.None);
  });

  it('should, when none is selected and "select all" is clicked, select all rows', () => {
    component.onSelectAll();
    expect(component.selection).toEqual(MOCK_RESPONSE);
    expect(component.ongoingActivity).toEqual(Activity.None);
  });

  it('should, when some are selected and "select all" is clicked, select all rows', () => {
    component.selection = MOCK_RESPONSE.slice(1);
    component.onSelectAll();
    expect(component.selection).toEqual(MOCK_RESPONSE);
    expect(component.ongoingActivity).toEqual(Activity.None);
  });

  it('should, when all are selected and "select all" is clicked, deselect all rows', () => {
    component.selection = MOCK_RESPONSE;
    component.onSelectAll();
    expect(component.selection).toEqual([]);
    expect(component.ongoingActivity).toEqual(Activity.None);
  });


  it('should, when sorting is changed, call the service with the appropriate attributes,', () => {

    // mixed orders
    component.onCustomSort({multiSortMeta: [
      {field: 'joining_user.login', order: -1},
      {field: 'at', order: 1}
    ]});
    expect(getRequestsService.getPendingRequests)
      .toHaveBeenCalledWith('99', [ '-joining_user.login', 'at' ], false);

    // check the field precedence counts
    component.onCustomSort({multiSortMeta: [
      {field: 'at', order: 1},
      {field: 'joining_user.login', order: -1}
    ]});
    expect(getRequestsService.getPendingRequests)
      .toHaveBeenCalledWith('99', [ 'at' , '-joining_user.login' ], false);

    // sort reset
    component.onCustomSort({multiSortMeta: []});
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledWith('99', [], false);
  });

  it('should, when accept is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'accept'
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Accept);

    expect(component.ongoingActivity).toEqual(Activity.Accepting);
    expect(requestActionsService.acceptJoinRequest).toHaveBeenCalledWith('99', ['12']);
    expect(requestActionsService.rejectJoinRequest).toHaveBeenCalledTimes(0);
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next(new Map([[ '12', 'success']]));

    expect(component.ongoingActivity).toEqual(Activity.None);
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'success',
    //   summary: 'Success',
    //   detail: '1 request(s) have been accepted',
    //   life: 5000
    // });
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should, when reject is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'reject'
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Reject);

    expect(component.ongoingActivity).toEqual(Activity.Rejecting);
    expect(requestActionsService.rejectJoinRequest).toHaveBeenCalledWith('99', ['12']);
    expect(requestActionsService.acceptJoinRequest).toHaveBeenCalledTimes(0);
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next(new Map([[ '12', 'success']]));

    expect(component.ongoingActivity).toEqual(Activity.None);
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'success',
    //   summary: 'Success',
    //   detail: '1 request(s) have been declined',
    //   life: 5000
    // });
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should, when an action is pressed, without selection, do nothing', () => {
    component.selection = [];
    component.onAcceptOrReject(Action.Accept);

    expect(component.ongoingActivity).toEqual(Activity.None);
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(1);  // the initial one
  });

  it('should consider "unchanged" in response as success', () => {
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Accept);

    serviceResponder$.next(new Map([['12', 'unchanged']]));

    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'success',
    //   summary: 'Success',
    //   detail: '1 request(s) have been accepted',
    //   life: 5000
    // });
  });

  it('should display an appropriate message on partial success', () => {
    component.selection = MOCK_RESPONSE; // select 10, 11 and 12
    component.onAcceptOrReject(Action.Accept);

    serviceResponder$.next(new Map([[ '11', 'invalid'], ['12', 'success'], ['10', 'success']]));

    expect(component.ongoingActivity).toEqual(Activity.None);
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'warn',
    //   summary: 'Partial success',
    //   detail: '2 request(s) have been accepted, 1 could not be executed',
    //   life: 5000
    // });
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should display an appropriate error message when all accept requests failed', () => {
    component.selection = MOCK_RESPONSE; // select 10, 11 and 12
    component.onAcceptOrReject(Action.Accept);

    serviceResponder$.next(new Map([[ '11', 'invalid'], ['12', 'cycle']]));

    expect(component.ongoingActivity).toEqual(Activity.None);
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'error',
    //   summary: 'Error',
    //   detail: 'Unable to accept the selected request(s).',
    //   life: 5000
    // });
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should display an appropriate error message when all reject requests failed', () => {
    component.selection = MOCK_RESPONSE; // select 10, 11 and 12
    component.onAcceptOrReject(Action.Reject);

    serviceResponder$.next(new Map([[ '11', 'invalid'], ['12', 'cycle']]));

    expect(component.ongoingActivity).toEqual(Activity.None);
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'error',
    //   summary: 'Error',
    //   detail: 'Unable to reject the selected request(s).',
    //   life: 5000
    // });
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should display an appropriate error message when the service fails', () => {
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Accept);

    serviceResponder$.error(new Error('...'));

    expect(component.ongoingActivity).toEqual(Activity.None);
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'error',
    //   summary: 'Error',
    //   detail: 'The action cannot be executed. If the problem persists, contact us.',
    //   life: 5000
    // });
    expect(getRequestsService.getPendingRequests).toHaveBeenCalledTimes(1); // service error does not reload content
    expect(component.selection).toEqual([ MOCK_RESPONSE[1] ]);
  });

});
