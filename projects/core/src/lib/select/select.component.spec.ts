import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectComponent } from './select.component';
import { ClickOutsideModule } from 'ng-click-outside';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;
  const mockItems = [
    'Item 1',
    'Item 2',
    'Item 3'
  ]

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ClickOutsideModule
      ],
      declarations: [ SelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    component.items = mockItems;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
