import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupNoPermissionComponent } from './group-no-permission.component';

describe('GroupNoPermissionComponent', () => {
  let component: GroupNoPermissionComponent;
  let fixture: ComponentFixture<GroupNoPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ GroupNoPermissionComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupNoPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
