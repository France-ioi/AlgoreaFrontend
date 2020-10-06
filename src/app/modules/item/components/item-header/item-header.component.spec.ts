import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppModule } from 'src/app/core/app.module';
import { Item } from '../../http-services/get-item-by-id.service';

import { ItemHeaderComponent } from './item-header.component';

describe('ItemHeaderComponent', () => {
  let component: ItemHeaderComponent;
  let fixture: ComponentFixture<ItemHeaderComponent>;
  const mockData: Item = {
    id: '11',
    requires_explicit_entry: true,
    string: {
    title: 'mock item',
    subtitle: 'mock subtitle',
    },
    permissions: {
      can_view: 'content',
    },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [ ItemHeaderComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemHeaderComponent);
    component = fixture.componentInstance;
    component.item = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
