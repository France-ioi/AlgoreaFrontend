import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { GetRequestsService, PendingRequest } from '../../data-access/get-requests.service';
import { Action, RequestActionsService } from '../../data-access/request-actions.service';
import { UserGroupInvitationsComponent } from './user-group-invitations.component';

const MOCK_RESPONSE_2: PendingRequest = {
  at: null,
  user: { id: '12', login: 'FredGast', firstName: 'Frederique', lastName: 'Gastard' },
  group: { id: '601', name: 'Dojo 50' }
};
const MOCK_RESPONSE: PendingRequest[] = [
  {
    at: null,
    user: { id: '11', login: 'MadameSoso', firstName: 'Marie-Sophie', lastName: 'Denis' },
    group: { id: '501', name: 'Dojo 50' }
  },
  MOCK_RESPONSE_2,
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
  let actionFeedbackService: ActionFeedbackService;
  let serviceResponder$: Subject<{changed: boolean}[]>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ UserGroupInvitationsComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: GetRequestsService, useValue: {
          getGroupInvitations: (_sort: any) => of<PendingRequest[]>(MOCK_RESPONSE),
        } },
        { provide: RequestActionsService, useValue: {
          processGroupInvitations: (_groupId: any[], _action: any) => serviceResponder$.asObservable()
        } },
        { provide: ActionFeedbackService, useValue: {
          success: (_m: any) => { },
          partial: (_m: any) => { },
          error: (_m: any) => { },
          unexpectedError: () => { },
        } }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    serviceResponder$ = new Subject<{changed: boolean}[]>();
    fixture = TestBed.createComponent(UserGroupInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    requestActionsService = TestBed.inject(RequestActionsService);
    getRequestsService = TestBed.inject(GetRequestsService);
    actionFeedbackService = TestBed.inject(ActionFeedbackService);
    spyOn(actionFeedbackService, 'success').and.callThrough();
    spyOn(actionFeedbackService, 'partial').and.callThrough();
    spyOn(actionFeedbackService, 'error').and.callThrough();
    spyOn(actionFeedbackService, 'unexpectedError').and.callThrough();
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
    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE_2 ] });

    expect(component.state).toEqual('processing');
    expect(requestActionsService.processGroupInvitations).toHaveBeenCalledWith([ '601' ], Action.Accept);
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next([{ changed: true }]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.success).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.success).toHaveBeenCalledWith('1 request(s) have been accepted');
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should, when reject is pressed, call the appropriate service and reload', () => {

    // step 1: select one and 'reject'
    component.onProcessRequests({ type: Action.Reject, data: [ MOCK_RESPONSE_2 ] });

    expect(component.state).toEqual('processing');
    expect(requestActionsService.processGroupInvitations).toHaveBeenCalledWith([ '601' ], Action.Reject);
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(1); // the initial one

    // step 2: success response received
    serviceResponder$.next([{ changed: true }]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.success).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.success).toHaveBeenCalledWith('1 request(s) have been declined');
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate message on partial success', () => {

    // step 1: select one and 'accept'
    component.onProcessRequests({ type: Action.Accept, data: MOCK_RESPONSE }); // select 10, 11 and 12

    expect(component.state).toEqual('processing');

    // step 2: success response received
    serviceResponder$.next([{ changed: true }, { changed: true }, { changed: false }]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.partial).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.partial).toHaveBeenCalledWith('2 request(s) have been accepted, 1 could not be executed');
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when all accept requests failed', () => {

    component.onProcessRequests({ type: Action.Accept, data: MOCK_RESPONSE }); // select 10, 11 and 12

    expect(component.state).toEqual('processing');

    serviceResponder$.next([
      { changed: false },
      { changed: false },
    ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.error).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.error).toHaveBeenCalledWith('Unable to accept the selected request(s).');
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when all reject requests failed', () => {

    component.onProcessRequests({ type: Action.Reject, data: MOCK_RESPONSE }); // select 10, 11 and 12

    expect(component.state).toEqual('processing');

    serviceResponder$.next([
      { changed: false },
      { changed: false },
    ]);
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.error).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.error).toHaveBeenCalledWith('Unable to reject the selected request(s).');
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(2);
  });

  it('should display an appropriate error message when the service fails', () => {

    component.onProcessRequests({ type: Action.Accept, data: [ MOCK_RESPONSE_2 ] });

    serviceResponder$.error(new HttpErrorResponse({}));
    serviceResponder$.complete();

    expect(component.state).toEqual('ready');
    expect(actionFeedbackService.unexpectedError).toHaveBeenCalledTimes(1);
    expect(actionFeedbackService.unexpectedError).toHaveBeenCalledWith();
    expect(getRequestsService.getGroupInvitations).toHaveBeenCalledTimes(1); // service error does not reload content
  });

});
