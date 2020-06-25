import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterGridComponent } from './chapter-grid.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

describe('ChapterGridComponent', () => {
  let component: ChapterGridComponent;
  let fixture: ComponentFixture<ChapterGridComponent>;
  const mockData = [
    {
      ID: 1,
      weight: 2,
      col1: 'video',
      col2: 'Morbi sit amet eleifend tortor',
      type: 0
    },
    {
      ID: 2,
      weight: '2',
      col1: 'video',
      col2: 'Morbi sit amet eleifend tortor',
      type: 1
    },
    {
      ID: 3,
      weight: 2,
      col1: 'conc.',
      col2: 'Morbi sit amet eleifend tortor',
      type: 2
    }
  ];

  beforeEach(async(() => {
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    TestBed.configureTestingModule({
      imports: [
        MatMenuModule
      ],
      declarations: [ ChapterGridComponent ],
      providers: [
        {
          provide: MatDialog,
          useValue: dialogSpy
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChapterGridComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
