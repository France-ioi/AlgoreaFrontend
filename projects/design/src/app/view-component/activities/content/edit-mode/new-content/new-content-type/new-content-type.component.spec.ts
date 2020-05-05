import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewContentTypeComponent } from './new-content-type.component';

describe('NewContentTypeComponent', () => {
  let component: NewContentTypeComponent;
  let fixture: ComponentFixture<NewContentTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewContentTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewContentTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
