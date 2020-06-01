import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupActiveTabComponent } from './group-active-tab.component';

describe('GroupActiveTabComponent', () => {
  let component: GroupActiveTabComponent;
  let fixture: ComponentFixture<GroupActiveTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupActiveTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupActiveTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
