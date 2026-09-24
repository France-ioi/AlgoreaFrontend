import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { APPCONFIG } from 'src/app/config';
import {
  GroupResultsExportRequest,
  GroupResultsExportService,
  GroupResultsTokenData,
} from 'src/app/data-access/group-results-export.service';
import { GroupProgressGridZipExportService } from './group-progress-grid-zip-export.service';

describe('GroupProgressGridZipExportService', () => {
  let service: GroupProgressGridZipExportService;
  let groupResultsExportService: jasmine.SpyObj<GroupResultsExportService>;
  let actionFeedbackService: jasmine.SpyObj<ActionFeedbackService>;

  const tokenData: GroupResultsTokenData = { groupResultsToken: 'tok', expiresIn: 60 };
  const exportData: GroupResultsExportRequest = {
    exportId: 'exp-1',
    expiresAt: 1893456000000,
  };

  beforeEach(() => {
    groupResultsExportService = jasmine.createSpyObj('GroupResultsExportService', [
      'getGroupResultsToken',
      'requestExport',
      'getDownloadUrl',
    ]);
    actionFeedbackService = jasmine.createSpyObj('ActionFeedbackService', [
      'error',
      'unexpectedError',
      'success',
    ]);

    TestBed.configureTestingModule({
      providers: [
        GroupProgressGridZipExportService,
        { provide: GroupResultsExportService, useValue: groupResultsExportService },
        { provide: ActionFeedbackService, useValue: actionFeedbackService },
        {
          provide: APPCONFIG,
          useValue: {
            featureFlags: { enableNotifications: true },
            slsApiUrl: 'https://sls.example',
          },
        },
      ],
    });
    service = TestBed.inject(GroupProgressGridZipExportService);
  });

  it('chains token then requestExport and shows success feedback', () => {
    groupResultsExportService.getGroupResultsToken.and.returnValue(of(tokenData));
    groupResultsExportService.requestExport.and.returnValue(of(exportData));

    service.export('42', '210');

    expect(groupResultsExportService.getGroupResultsToken).toHaveBeenCalledWith('42', [ '210' ]);
    expect(groupResultsExportService.requestExport).toHaveBeenCalledWith('tok', '42', [ '210' ]);
    expect(actionFeedbackService.success).toHaveBeenCalledWith(
      jasmine.stringMatching(/export requested/i),
    );
    expect(service.isFetching()).toBe(false);
  });

  it('toggles isFetching via finalize', () => {
    const token$ = new Subject<GroupResultsTokenData>();
    groupResultsExportService.getGroupResultsToken.and.returnValue(token$.asObservable());
    groupResultsExportService.requestExport.and.returnValue(of(exportData));

    service.export('42', '210');
    expect(service.isFetching()).toBe(true);

    token$.next(tokenData);
    token$.complete();

    expect(service.isFetching()).toBe(false);
  });

  it('ignores overlapping export while isFetching', () => {
    const token$ = new Subject<GroupResultsTokenData>();
    groupResultsExportService.getGroupResultsToken.and.returnValue(token$.asObservable());

    service.export('42', '210');
    service.export('42', '210');

    expect(groupResultsExportService.getGroupResultsToken).toHaveBeenCalledTimes(1);
    token$.complete();
  });

  it('maps backend 403 errors to actionFeedbackService.error', () => {
    const httpError = new HttpErrorResponse({
      error: { error_text: 'Insufficient access rights' },
      status: 403,
      statusText: 'Forbidden',
    });
    groupResultsExportService.getGroupResultsToken.and.returnValue(throwError(() => httpError));

    service.export('42', '210');

    expect(actionFeedbackService.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/permission to export answers/i),
      undefined,
    );
    expect(actionFeedbackService.unexpectedError).not.toHaveBeenCalled();
    expect(groupResultsExportService.requestExport).not.toHaveBeenCalled();
    expect(service.isFetching()).toBe(false);
  });

  it('maps serverless 503 errors after token success', () => {
    groupResultsExportService.getGroupResultsToken.and.returnValue(of(tokenData));
    groupResultsExportService.requestExport.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 503,
      statusText: 'Service Unavailable',
    })));

    service.export('42', '210');

    expect(actionFeedbackService.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/temporarily unavailable/i),
      undefined,
    );
    expect(service.isFetching()).toBe(false);
  });

  it('maps missing slsApiUrl from requireSlsApiUrl to user feedback', () => {
    groupResultsExportService.getGroupResultsToken.and.returnValue(of(tokenData));
    groupResultsExportService.requestExport.and.returnValue(
      throwError(() => new Error('slsApiUrl is not configured')),
    );

    service.export('42', '210');

    expect(actionFeedbackService.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/not configured/i),
      jasmine.anything(),
    );
    expect(service.isFetching()).toBe(false);
  });
});

describe('GroupProgressGridZipExportService without notifications', () => {
  it('does not start export when notifications are unavailable', () => {
    TestBed.resetTestingModule();
    const groupResultsExportService = jasmine.createSpyObj('GroupResultsExportService', [
      'getGroupResultsToken',
      'requestExport',
    ]);
    const actionFeedbackService = jasmine.createSpyObj('ActionFeedbackService', [
      'error',
      'unexpectedError',
      'success',
    ]);

    TestBed.configureTestingModule({
      providers: [
        GroupProgressGridZipExportService,
        { provide: GroupResultsExportService, useValue: groupResultsExportService },
        { provide: ActionFeedbackService, useValue: actionFeedbackService },
        {
          provide: APPCONFIG,
          useValue: {
            featureFlags: { enableNotifications: false },
            slsApiUrl: 'https://sls.example',
          },
        },
      ],
    });
    const service = TestBed.inject(GroupProgressGridZipExportService);

    service.export('42', '210');

    expect(groupResultsExportService.getGroupResultsToken).not.toHaveBeenCalled();
    expect(actionFeedbackService.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/notifications are disabled/i),
    );
  });
});
