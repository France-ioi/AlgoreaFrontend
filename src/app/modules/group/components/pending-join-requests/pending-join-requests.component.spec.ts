import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { Subject } from 'rxjs';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { GetRequestsService, PendingRequest } from '../../http-services/get-requests.service';
import { Action, RequestActionsService } from '../../http-services/request-actions.service';
import { PendingJoinRequestsComponent } from './pending-join-requests.component';

const MOCK_RESPONSE_2 = {
  at: null,
  user: { id: '12', login: 'FredGast', firstName: 'Frederique', lastName: 'Gastard' },
  group: { id: '50', name: 'Dojo 50' }
};
const MOCK_RESPONSE: PendingRequest[] = [
  {
    at: null,
    user: { id: '11', login: 'MadameSoso', firstName: 'Marie-Sophie', lastName: 'Denis' },
    group: { id: '50', name: 'Dojo 50' }
  },
  MOCK_RESPONSE_2,
  {
    at: null,
    user: { id: '10', login: 'Jeandu88', firstName: 'Jean', lastName: 'Dujardin' },
    group: { id: '50', name: 'Dojo 50' }
  }

];

describe('PendingJoinRequestsComponent', () => {
  let component: PendingJoinRequestsComponent;
  let fixture: ComponentFixture<PendingJoinRequestsComponent>;
  let requestActionsService: RequestActionsService;
  let getRequestsService: GetRequestsService;
  let actionFeedbackService: ActionFeedbackService;
  let serviceResponder$: Subject<Map<string,any>[]>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingJoinRequestsComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: GetRequestsService, useValue: {
          getGroupPendingRequests: (_id: any, _sort: any, _includeSubgroup: any) => of<PendingRequest[]>(MOCK_RESPONSE),
        } },
        { provide: RequestActionsService, useValue: {
          processJoinRequests: (_ids: Map<string, string[]>, _action: any) => serviceResponder$.asObservable(),
        } },
        { provide: ActionFeedbackService, useValue: {
          success: (_m: any) => {},
          partial: (_m: any) => {},
          error: (_m: any) => {},
          unexpectedError: () => {},
        } }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    serviceResponder$ = new Subject<Map<string,any>[]>();
    fixture = TestBed.createComponent(PendingJoinRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    requestActionsService = TestBed.inject(RequestActionsService);
    getRequestsService = TestBed.inject(GetRequestsService);
    actionFeedbackService = TestBed.inject(ActionFeedbackService);
    component.groupId = '99';
    spyOn(actionFeedbackService, 'success').and.callThrough();
    spyOn(actionFeedbackService, 'partial').and.callThrough();
    spyOn(actionFeedbackService, 'error').and.callThrough();
    spyOn(actionFeedbackService, 'unexpectedError').and.callThrough();
    spyOn(getRequestsService, 'getGroupPendingRequests').and.callThrough();
    spyOn(requestActionsService, 'processJoinRequests').and.callThrough();
    component.ngOnChanges({});
  });

  afterEach(() => {
    serviceResponder$.complete();
  });

  it('should load requests at init', () => {
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledWith('99', false, []);
    expect(component.requests).toEqual(MOCK_RESPONSE);
    expect(component.currentSort).toEqual([]);
    expect(component.state).toEqual('ready');
  });

  it('should, when sorting is changed, call the service with the appropriate attributes,', () => {

    // mixed orders
    component.onFetch([ '-joining_user.login', 'at' ]);
    expect(getRequestsService.getGroupPendingRequests)
      .toHaveBeenCalledWith('99', false, [ '-joining_user.login', 'at' ]);

    // check the field precedence counts
    component.onFetch([ 'at' , '-joining_user.login' ]);
    expect(getRequestsService.getGroupPendingRequests)
      .toHaveBeenCalledWith('99', false, [ 'at' , '-joining_user.login' ]);

    // sort reset
    component.onFetch([]);
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledWith('99', false, []);
  });

  it('should, when accept is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'accept'
    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE_2 ] });

    expect(component.state).toEqual('processing');
    expect(requestActionsService.processJoinRequests).toHaveBeenCalledWith(new Map([ [ '50', [ '12' ] ] ]), Action.Accept);
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next([ new Map([ [ '12', 'success' ] ]) ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.success).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.success).toHaveBeenCalledWith('1 request(s) have been accepted');
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(2);
  });

  it('should, when reject is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'reject'
    component.onProcessRequests({ type: Action.Reject, data: [ MOCK_RESPONSE_2 ] });

    expect(component.state).toEqual('processing');
    expect(requestActionsService.processJoinRequests).toHaveBeenCalledWith(new Map([ [ '50', [ '12' ] ] ]), Action.Reject);
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next([ new Map([ [ '12', 'success' ] ]) ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.success).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.success).toHaveBeenCalledWith('1 request(s) have been declined');
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(2);
  });

  it('should consider "unchanged" in response as success', () => {
    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE_2 ] });

    serviceResponder$.next([ new Map([ [ '12', 'unchanged' ] ]) ]);
    serviceResponder$.complete();

    expect(actionFeedbackService.success).toHaveBeenCalledWith('1 request(s) have been accepted');
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
    expect(actionFeedbackService.partial).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.partial).toHaveBeenCalledWith('2 request(s) have been accepted, 1 could not be executed');
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when all accept requests failed', () => {
    component.onProcessRequests({ type: Action.Accept, data: MOCK_RESPONSE }); // select 10, 11 and 12

    serviceResponder$.next([
      new Map([ [ '11', 'invalid' ] ]),
      new Map([ [ '12', 'cycle' ] ]),
    ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.error).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.error).toHaveBeenCalledWith('Unable to accept the selected request(s).');
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when all reject requests failed', () => {
    component.onProcessRequests({ type: Action.Reject, data: MOCK_RESPONSE }); // select 10, 11 and 12

    serviceResponder$.next([
      new Map([ [ '11', 'invalid' ] ]),
      new Map([ [ '12', 'cycle' ] ]),
    ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.error).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.error).toHaveBeenCalledWith('Unable to reject the selected request(s).');
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when the service fails', () => {
    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE_2 ] });

    serviceResponder$.error(new HttpErrorResponse({}));
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.unexpectedError).toHaveBeenCalledTimes(1);
    expect(getRequestsService.getGroupPendingRequests).toHaveBeenCalledTimes(1); // service error does not reload content
  });

});
