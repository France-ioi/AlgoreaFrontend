import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessEditDialogComponent } from './access-edit-dialog.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material';

describe('AccessEditDialogComponent', () => {
  let component: AccessEditDialogComponent;
  let fixture: ComponentFixture<AccessEditDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule
      ],
      declarations: [ AccessEditDialogComponent ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {}
        },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: {} 
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
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
