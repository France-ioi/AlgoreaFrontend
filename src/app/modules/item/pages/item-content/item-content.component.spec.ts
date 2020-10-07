import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppModule } from 'src/app/core/app.module';
import { mockItemData } from '../../mocks/itemData-mock';
import { ItemDataSource } from '../../services/item-datasource.service';

import { ItemContentComponent } from './item-content.component';

describe('ItemContentComponent', () => {
  let component: ItemContentComponent;
  let fixture: ComponentFixture<ItemContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        HttpClientTestingModule,
      ],
      declarations: [ ItemContentComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [ { provide: ItemDataSource, useValue: {
        itemData$: of(mockItemData)
      }}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
