import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyGroupsComponent } from './my-groups.component';

describe('MyGroupsComponent', () => {
  let component: MyGroupsComponent;
  let fixture: ComponentFixture<MyGroupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MyGroupsComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
