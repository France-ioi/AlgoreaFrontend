import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupHeaderComponent } from './group-header.component';
import { CoreModule } from 'core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GroupHeaderComponent', () => {
  let component: GroupHeaderComponent;
  let fixture: ComponentFixture<GroupHeaderComponent>;
  const mockData = {
    ID: 11,
    name: 'CoderDojo 50',
    type: 'Other',
    grades: [-2],
    date: new Date(),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      declarations: [ GroupHeaderComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupHeaderComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
