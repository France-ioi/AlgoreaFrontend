import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionParagraphComponent } from './section-paragraph.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SectionParagrahComponent', () => {
  let component: SectionParagraphComponent;
  let fixture: ComponentFixture<SectionParagraphComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SectionParagraphComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionParagraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
