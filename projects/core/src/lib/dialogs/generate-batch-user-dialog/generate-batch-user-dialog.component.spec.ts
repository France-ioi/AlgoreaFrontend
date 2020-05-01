import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateBatchUserDialogComponent } from './generate-batch-user-dialog.component';

describe('GenerateBatchUserDialogComponent', () => {
  let component: GenerateBatchUserDialogComponent;
  let fixture: ComponentFixture<GenerateBatchUserDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GenerateBatchUserDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateBatchUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
