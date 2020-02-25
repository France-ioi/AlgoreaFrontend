import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinGroupDialogComponent } from './join-group-dialog.component';

describe('JoinGroupDialogComponent', () => {
  let component: JoinGroupDialogComponent;
  let fixture: ComponentFixture<JoinGroupDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinGroupDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
