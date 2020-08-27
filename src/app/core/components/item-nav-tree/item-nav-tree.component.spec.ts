import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemNavTreeComponent } from './item-nav-tree.component';
import { Router } from '@angular/router';
import { ResultActionsService } from 'src/app/shared/http-services/result-actions.service';

describe('ItemNavTreeComponent', () => {
  let component: ItemNavTreeComponent;
  let fixture: ComponentFixture<ItemNavTreeComponent>;

  beforeEach(async(() => {
    const routerSpy = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ResultActionsService, useValue: {

        }},
      ],
      declarations: [ ItemNavTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemNavTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
