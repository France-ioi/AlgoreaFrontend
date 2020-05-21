import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOverviewComponent } from './group-overview.component';
import { CoreModule } from 'core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GroupOverviewComponent', () => {
  let component: GroupOverviewComponent;
  let fixture: ComponentFixture<GroupOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      declarations: [ GroupOverviewComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
