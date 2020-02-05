import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorBarComponent } from './editor-bar.component';

describe('EditorBarComponent', () => {
  let component: EditorBarComponent;
  let fixture: ComponentFixture<EditorBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditorBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
