import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterGridComponent } from './chapter-grid.component';

describe('ChapterGridComponent', () => {
  let component: ChapterGridComponent;
  let fixture: ComponentFixture<ChapterGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChapterGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChapterGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
