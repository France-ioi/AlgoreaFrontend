import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupTabComponent } from './group-tab.component';

describe('GroupTabComponent', () => {
  let component: GroupTabComponent;
  let fixture: ComponentFixture<GroupTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
