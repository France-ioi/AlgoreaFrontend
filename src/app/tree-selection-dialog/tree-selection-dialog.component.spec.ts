import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeSelectionDialogComponent } from './tree-selection-dialog.component';

describe('TreeSelectionDialogComponent', () => {
  let component: TreeSelectionDialogComponent;
  let fixture: ComponentFixture<TreeSelectionDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeSelectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
