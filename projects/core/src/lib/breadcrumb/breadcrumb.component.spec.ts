import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadcrumbComponent } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;
  const mockItems = {
    selectedID: 42,
    path: [
      { ID: 1, label: 'Contest', separator: 'slash' },
      {
        ID: 42,
        label: 'Personalized contest',
        attempt: 12,
        separator: 'arrow'
      },
      { ID: 43, label: 'Personalized contests', attempt: 12 },
      { ID: 23, label: 'IOI Selection 2012', attempt: 2 },
      { ID: 24, label: 'Individuals', separator: 'slash' }
    ]
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BreadcrumbComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    component.items = mockItems;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
