import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridGearComponent } from './grid-gear.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GridGearComponent', () => {
  let component: GridGearComponent;
  let fixture: ComponentFixture<GridGearComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GridGearComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GridGearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
