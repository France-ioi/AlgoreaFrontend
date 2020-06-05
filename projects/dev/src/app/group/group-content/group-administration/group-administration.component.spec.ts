import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAdministrationComponent } from './group-administration.component';

describe('GroupAdministrationComponent', () => {
  let component: GroupAdministrationComponent;
  let fixture: ComponentFixture<GroupAdministrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupAdministrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupAdministrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
