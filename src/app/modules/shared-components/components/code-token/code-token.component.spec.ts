import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeTokenComponent } from './code-token.component';

describe('CodeTokenComponent', () => {
  let component: CodeTokenComponent;
  let fixture: ComponentFixture<CodeTokenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ CodeTokenComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
