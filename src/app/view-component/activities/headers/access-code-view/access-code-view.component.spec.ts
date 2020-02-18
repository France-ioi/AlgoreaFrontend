import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessCodeViewComponent } from './access-code-view.component';

describe('AccessCodeViewComponent', () => {
  let component: AccessCodeViewComponent;
  let fixture: ComponentFixture<AccessCodeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccessCodeViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccessCodeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
