import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagedGroupsComponent } from './managed-groups.component';

describe('ManagedGroupsComponent', () => {
  let component: ManagedGroupsComponent;
  let fixture: ComponentFixture<ManagedGroupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagedGroupsComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagedGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
