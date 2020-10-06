import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupJoinByCodeComponent } from './group-join-by-code.component';
import { MessageService } from 'primeng/api';
import { mockGroup } from '../../mocks/group-by-id';
import { GroupActionsService } from '../../http-services/group-actions.service';
import { CodeActionsService } from '../../http-services/code-actions.service';


describe('GroupJoinByCodeComponent', () => {
  let component: GroupJoinByCodeComponent;
  let fixture: ComponentFixture<GroupJoinByCodeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupJoinByCodeComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: MessageService, useValue: { add: (_m: any) => {} } },
        { provide: GroupActionsService, useValue: {} },
        { provide: CodeActionsService, useValue: {} },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupJoinByCodeComponent);
    component = fixture.componentInstance;
    component.group = mockGroup;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
