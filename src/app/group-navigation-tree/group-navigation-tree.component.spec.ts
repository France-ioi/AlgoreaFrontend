import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNavigationTreeComponent } from './group-navigation.component';

describe('GroupNavigationComponent', () => {
  let component: GroupNavigationTreeComponent;
  let fixture: ComponentFixture<GroupNavigationTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupNavigationTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupNavigationTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
