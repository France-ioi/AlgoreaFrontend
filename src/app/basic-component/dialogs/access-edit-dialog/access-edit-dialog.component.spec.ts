import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessEditDialogComponent } from './access-edit-dialog.component';

describe('AccessEditDialogComponent', () => {
  let component: AccessEditDialogComponent;
  let fixture: ComponentFixture<AccessEditDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccessEditDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccessEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
