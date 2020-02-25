import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupRightHeaderComponent } from './group-right-header.component';

describe('GroupRightHeaderComponent', () => {
  let component: GroupRightHeaderComponent;
  let fixture: ComponentFixture<GroupRightHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupRightHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupRightHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
