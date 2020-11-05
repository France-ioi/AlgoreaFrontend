import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinedGroupsComponent } from './joined-groups.component';

describe('JoinedGroupsComponent', () => {
  let component: JoinedGroupsComponent;
  let fixture: ComponentFixture<JoinedGroupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinedGroupsComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinedGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
