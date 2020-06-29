import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRequestComponent, Activity, Action } from './pending-request.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupService } from '../../../shared/http/services/group.service';
import { of, Subject } from 'rxjs';
import { PendingRequest } from '../../../shared/models/pending-request.model';
import { RequestActionResponse } from '../../../shared/models/requet-action-response.model';
import { MessageService } from 'primeng/api';

const MOCK_RESPONSE = [
  {
    member_id: '11',
    at: null,
    action: 'join_request_created',
    joining_user:  { group_id: '11', login: 'MadameSoso', first_name: 'Marie-Sophie', last_name: 'Denis', grade: 3 },
    inviting_user: { group_id: '20', login: 'CyrilK67', first_name: 'Cyril', last_name: 'Kitsch', grade: -1 }
  },
  {
    member_id: '12',
    at: null,
    action: 'join_request_created',
    joining_user: { group_id: '12', login: 'FredGast', first_name: 'Frederique', last_name: 'Gastard', grade: 2 },
    inviting_user: { group_id: '20', login: 'CyrilK67', first_name: 'Cyril', last_name: 'Kitsch', grade: -1 }
  },
  {
    member_id: '10',
    at: null,
    action: 'join_request_created',
    joining_user: { group_id: '10', login: 'Jeandu88', first_name: 'Jean', last_name: 'Dujardin', grade: 3 },
    inviting_user: { group_id: '20', login: 'CyrilK67', first_name: 'Cyril', last_name: 'Kitsch', grade: -1 }
  }

];

describe('PendingRequestComponent', () => {
  let component: PendingRequestComponent;
  let fixture: ComponentFixture<PendingRequestComponent>;
  let groupService: GroupService;
  let messageService: MessageService;
  let serviceResponder$: Subject<RequestActionResponse>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingRequestComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: MessageService, useValue: { add: (_m) => {} } },
        { provide: GroupService, useValue:
          {
            getManagedRequests: (_id, _sort) => of<PendingRequest[]>(MOCK_RESPONSE),
            acceptJoinRequest: (_id, _groupIds) => serviceResponder$.asObservable(),
            rejectJoinRequest: (_id, _groupIds) => serviceResponder$.asObservable(),
          }
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    serviceResponder$ = new Subject<RequestActionResponse>();
    fixture = TestBed.createComponent(PendingRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    groupService = TestBed.inject(GroupService);
    messageService = TestBed.inject(MessageService);
    component.id = '99';
    spyOn(messageService, 'add').and.callThrough();
    spyOn(groupService, 'getManagedRequests').and.callThrough();
    spyOn(groupService, 'acceptJoinRequest').and.callThrough();
    spyOn(groupService, 'rejectJoinRequest').and.callThrough();
    component.ngOnChanges(null);
  });

  afterEach(() => {
    serviceResponder$.complete();
  });

  it('should load requests at init', () => {
    expect(groupService.getManagedRequests).toHaveBeenCalledWith('99', []);
    expect(component.requests).toEqual(MOCK_RESPONSE);
    expect(component.selection).toEqual([]);
    expect(component.panel.length).toEqual(1);
    expect(component.currentSort).toEqual([]);
    expect(component.isIdle()).toBeTruthy();
  });

  it('should, when none is selected and "select all" is clicked, select all rows', () => {
    component.onSelectAll(null);
    expect(component.selection).toEqual(MOCK_RESPONSE);
    expect(component.onGoingActivity).toEqual(Activity.None);
  });

  it('should, when some are selected and "select all" is clicked, select all rows', () => {
    component.selection = MOCK_RESPONSE.slice(1);
    component.onSelectAll(null);
    expect(component.selection).toEqual(MOCK_RESPONSE);
    expect(component.onGoingActivity).toEqual(Activity.None);
  });

  it('should, when all are selected and "select all" is clicked, deselect all rows', () => {
    component.selection = MOCK_RESPONSE;
    component.onSelectAll(null);
    expect(component.selection).toEqual([]);
    expect(component.onGoingActivity).toEqual(Activity.None);
  });


  it('should, when sorting is changed, call the service with the appropriate attributes,', () => {

    // mixed orders
    component.onCustomSort({multiSortMeta: [
      {field: 'joining_user.login', order: -1},
      {field: 'at', order: 1}
    ]});
    expect(groupService.getManagedRequests)
      .toHaveBeenCalledWith('99', [ '-joining_user.login', 'at' ]);

    // check the field precedence counts
    component.onCustomSort({multiSortMeta: [
      {field: 'at', order: 1},
      {field: 'joining_user.login', order: -1}
    ]});
    expect(groupService.getManagedRequests)
      .toHaveBeenCalledWith('99', [ 'at' , '-joining_user.login' ]);

    // sort reset
    component.onCustomSort({multiSortMeta: []});
    expect(groupService.getManagedRequests).toHaveBeenCalledWith('99', []);
  });

  it('should, when accept is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'accept'
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Accept);

    expect(component.isAccepting()).toBeTruthy();
    expect(groupService.acceptJoinRequest).toHaveBeenCalledWith('99', ['12']);
    expect(groupService.rejectJoinRequest).toHaveBeenCalledTimes(0);
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next({
      success: true,
      message: 'updated',
      data: new Map([[ '12', 'success']])
    });

    expect(component.isIdle()).toBeTruthy();
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'success',
    //   summary: 'Success',
    //   detail: '1 request(s) have been accepted',
    //   life: 5000
    // });
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should, when reject is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'reject'
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Reject);

    expect(component.isRejecting()).toBeTruthy();
    expect(groupService.rejectJoinRequest).toHaveBeenCalledWith('99', ['12']);
    expect(groupService.acceptJoinRequest).toHaveBeenCalledTimes(0);
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next({
      success: true,
      message: 'updated',
      data: new Map([[ '12', 'success']])
    });

    expect(component.isIdle()).toBeTruthy();
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'success',
    //   summary: 'Success',
    //   detail: '1 request(s) have been declined',
    //   life: 5000
    // });
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should, when an action is pressed, without selection, do nothing', () => {
    component.selection = [];
    component.onAcceptOrReject(Action.Accept);

    expect(component.isIdle()).toBeTruthy();
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(1);  // the initial one
  });

  it('should consider "unchanged" in response as success', () => {
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Accept);

    serviceResponder$.next({
      success: true,
      message: 'updated',
      data: new Map([['12', 'unchanged']])
    });

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

    serviceResponder$.next({
      success: true,
      message: 'updated',
      data: new Map([[ '11', 'invalid'], ['12', 'success'], ['10', 'success']])
    });

    expect(component.isIdle()).toBeTruthy();
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'warn',
    //   summary: 'Partial success',
    //   detail: '2 request(s) have been accepted, 1 could not be executed',
    //   life: 5000
    // });
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should display an appropriate error message when all accept requests failed', () => {
    component.selection = MOCK_RESPONSE; // select 10, 11 and 12
    component.onAcceptOrReject(Action.Accept);

    serviceResponder$.next({
      success: true,
      message: 'updated',
      data: new Map([[ '11', 'invalid'], ['12', 'cycle']])
    });

    expect(component.isIdle()).toBeTruthy();
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'error',
    //   summary: 'Error',
    //   detail: 'Unable to accept the selected request(s).',
    //   life: 5000
    // });
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should display an appropriate error message when all reject requests failed', () => {
    component.selection = MOCK_RESPONSE; // select 10, 11 and 12
    component.onAcceptOrReject(Action.Reject);

    serviceResponder$.next({
      success: true,
      message: 'updated',
      data: new Map([[ '11', 'invalid'], ['12', 'cycle']])
    });

    expect(component.isIdle()).toBeTruthy();
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'error',
    //   summary: 'Error',
    //   detail: 'Unable to reject the selected request(s).',
    //   life: 5000
    // });
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(2);
    expect(component.selection).toEqual([]);
  });

  it('should display an appropriate error message when the service fails', () => {
    component.selection = [ MOCK_RESPONSE[1] ];
    component.onAcceptOrReject(Action.Accept);

    serviceResponder$.error(new Error('...'));

    expect(component.isIdle()).toBeTruthy();
    // expect(messageService.add).toHaveBeenCalledTimes(1);
    // expect(messageService.add).toHaveBeenCalledWith({
    //   severity: 'error',
    //   summary: 'Error',
    //   detail: 'The action cannot be executed. If the problem persists, contact us.',
    //   life: 5000
    // });
    expect(groupService.getManagedRequests).toHaveBeenCalledTimes(1); // service error does not reload content
    expect(component.selection).toEqual([ MOCK_RESPONSE[1] ]);
  });

});
