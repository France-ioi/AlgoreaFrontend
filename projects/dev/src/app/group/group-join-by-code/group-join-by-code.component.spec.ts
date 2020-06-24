import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupJoinByCodeComponent } from './group-join-by-code.component';
import { GroupService } from '../../shared/services/api/group.service';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Group } from '../../shared/models/group.model';


describe('GroupJoinByCodeComponent', () => {
  let component: GroupJoinByCodeComponent;
  let fixture: ComponentFixture<GroupJoinByCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupJoinByCodeComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: MessageService, useValue: { add: (_m) => {} } },
        { provide: GroupService, useValue: {
            getLatestGroup: () => of(new Group()),
          },
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupJoinByCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
