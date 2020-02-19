import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachGroupDialogComponent } from './attach-group-dialog.component';

describe('AttachGroupDialogComponent', () => {
  let component: AttachGroupDialogComponent;
  let fixture: ComponentFixture<AttachGroupDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttachGroupDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
