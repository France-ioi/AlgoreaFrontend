import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupCompositionComponent } from './group-composition.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GroupDataSource } from '../../services/group-datasource.service';
import { mockGroup } from '../../mocks/group-by-id';
import { of } from 'rxjs';
import { readyState } from 'src/app/shared/helpers/state';
import { MessageService } from 'primeng/api';

describe('GroupCompositionComponent', () => {
  let component: GroupCompositionComponent;
  let fixture: ComponentFixture<GroupCompositionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ GroupCompositionComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [{ provide: GroupDataSource, useValue: {
        group$: of(readyState(mockGroup))
      } }, { provide: MessageService, useValue: { add: (_m: any) => {} } }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
