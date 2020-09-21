import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemDetailsComponent } from './item-details.component';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { NavItem } from 'src/app/shared/services/nav-types';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { GetBreadcrumbService } from '../../http-services/get-breadcrumb.service';

describe('ItemDetailsComponent', () => {
  let component: ItemDetailsComponent;
  let fixture: ComponentFixture<ItemDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemDetailsComponent ],
      providers: [
        { provide: CurrentContentService, useValue: {
          setCurrent: (_i: NavItem) => {},
          setPageInfo: (_p: any) => {},
        }},
        { provide: ActivatedRoute, useValue: {
          paramMap: of({
            get: (_s: string) => '30'
          }),
          snapshot: {
            paramMap: {
              get: (_s: string) => '30',
              has: (_s: string) => true,
            }
          }
        }},
        { provide: GetBreadcrumbService, useValue: {
          getBreadcrumb: (_p: any, _a: any) => of([]),
          getBreadcrumbWithParentAttempt: (_p: any, _a: any) => of([]),
        }}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
