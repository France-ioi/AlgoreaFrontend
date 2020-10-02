import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupHeaderComponent } from './group-header.component';
import { AppModule } from '../../../../core/app.module';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GroupHeaderComponent', () => {
  let component: GroupHeaderComponent;
  let fixture: ComponentFixture<GroupHeaderComponent>;
  const mockData = {
    id: '11',
    name: 'CoderDojo 50',
    type: 'Other',
    is_public: false,
    grades: [-2],
    date: new Date(),
    description: 'dummy',
    current_user_is_manager: false
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [ GroupHeaderComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupHeaderComponent);
    component = fixture.componentInstance;
    component.group = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
