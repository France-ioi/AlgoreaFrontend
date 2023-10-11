import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRequestComponent } from './pending-request.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PendingRequest } from '../../data-access/get-requests.service';

const MOCK_RESPONSE: PendingRequest[] = [
  {
    at: null,
    user: { id: '11', login: 'MadameSoso', firstName: 'Marie-Sophie', lastName: 'Denis' },
    group: { id: '50', name: 'Dojo 50' }
  },
  {
    at: null,
    user: { id: '12', login: 'FredGast', firstName: 'Frederique', lastName: 'Gastard' },
    group: { id: '50', name: 'Dojo 50' }
  },
  {
    at: null,
    user: { id: '10', login: 'Jeandu88', firstName: 'Jean', lastName: 'Dujardin' },
    group: { id: '50', name: 'Dojo 50' }
  }
];

describe('PendingRequestComponent', () => {
  let component: PendingRequestComponent<PendingRequest>;
  let fixture: ComponentFixture<PendingRequestComponent<PendingRequest>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ PendingRequestComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<PendingRequestComponent<PendingRequest>>(PendingRequestComponent);
    component = fixture.componentInstance;
    component.requests = MOCK_RESPONSE;
    component.state = 'ready';
    spyOn(component.sort, 'emit');
    fixture.detectChanges();
    component.ngOnChanges({});
  });

  it('should, when none is selected and "select all" is clicked, select all rows', () => {
    component.onSelectAll();
    expect(component.selection).toEqual(MOCK_RESPONSE);
    expect(component.state).toEqual('ready');
  });

  it('should, when some are selected and "select all" is clicked, select all rows', () => {
    component.selection = MOCK_RESPONSE.slice(1);
    component.onSelectAll();
    expect(component.selection).toEqual(MOCK_RESPONSE);
    expect(component.state).toEqual('ready');
  });

  it('should, when all are selected and "select all" is clicked, deselect all rows', () => {
    component.selection = MOCK_RESPONSE;
    component.onSelectAll();
    expect(component.selection).toEqual([]);
    expect(component.state).toEqual('ready');
  });


  it('should, when sorting is changed, call the service with the appropriate attributes,', () => {
    // mixed orders
    component.onCustomSort({ multiSortMeta: [
      { field: 'joining_user.login', order: -1 },
      { field: 'at', order: 1 }
    ] });
    expect(component.sort.emit).toHaveBeenCalledWith([ '-joining_user.login', 'at' ]);

    // check the field precedence counts
    component.onCustomSort({ multiSortMeta: [
      { field: 'at', order: 1 },
      { field: 'joining_user.login', order: -1 }
    ] });
    expect(component.sort.emit).toHaveBeenCalledWith([ 'at' , '-joining_user.login' ]);

    // sort reset
    component.onCustomSort({ multiSortMeta: [] });
    expect(component.sort.emit).toHaveBeenCalledWith([]);
  });

});
