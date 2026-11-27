import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { GroupManagerListComponent } from './group-manager-list.component';
import { GetGroupManagersService, Manager } from '../../data-access/get-group-managers.service';
import { RemoveGroupManagerService } from '../../data-access/remove-group-manager.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { GroupManagerAddComponent } from '../group-manager-add/group-manager-add.component';
import { Group } from '../../models/group';

function manager(id: string, canManage: Manager['canManage']): Manager {
  return { id, name: `Manager ${id}`, canManage, canGrantGroupAccess: false, canWatchMembers: false };
}

describe('GroupManagerListComponent', () => {
  let fixture: ComponentFixture<GroupManagerListComponent>;
  let removeBatch: jasmine.Spy;

  function setup(managers: Manager[]): void {
    removeBatch = jasmine.createSpy('removeBatch').and.returnValue(of({ countRequests: 1, countSuccess: 1 }));
    TestBed.configureTestingModule({
      imports: [ GroupManagerListComponent ],
      providers: [
        provideRouter([]),
        provideMockStore(),
        { provide: GetGroupManagersService, useValue: { getGroupManagers: () => of(managers) } },
        { provide: RemoveGroupManagerService, useValue: { removeBatch } },
        { provide: UserSessionService, useValue: { session$: { getValue: () => ({ groupId: 'me' }) } } },
      ],
    }).overrideComponent(GroupManagerListComponent, {
      remove: { imports: [ GroupManagerAddComponent ] },
      add: { schemas: [ NO_ERRORS_SCHEMA ] },
    });
    fixture = TestBed.createComponent(GroupManagerListComponent);
    fixture.componentRef.setInput('group', { id: '1', currentUserCanManage: 'memberships_and_group' } as unknown as Group);
    fixture.detectChanges();
  }

  const rowBoxes = (): HTMLInputElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('td input[type=checkbox]'));
  const selectAll = (): HTMLInputElement => fixture.nativeElement.querySelector('#select-all-checkbox');
  const click = (el: HTMLElement): void => {
    el.click();
    fixture.detectChanges();
  };
  const remove = (): void => click(fixture.nativeElement.querySelector('[data-testid=remove-group-managers]'));

  describe('with direct and ancestor-only managers', () => {
    beforeEach(() => setup([ manager('1', 'memberships'), manager('2', null), manager('3', 'memberships_and_group') ]));

    it('"Select all" checks only direct managers', () => {
      click(selectAll());
      expect(rowBoxes().map(b => b.checked)).toEqual([ true, false, true ]);
      expect(rowBoxes().map(b => b.disabled)).toEqual([ false, true, false ]);
    });

    it('removal after "Select all" sends only direct managers', () => {
      click(selectAll());
      remove();
      expect(removeBatch).toHaveBeenCalledWith('1', [ '1', '3' ], undefined);
    });

    it('"Select all" is checked once all direct managers are selected one by one', () => {
      expect(selectAll().checked).toBeFalse();
      click(rowBoxes()[0]!);
      expect(selectAll().checked).toBeFalse();
      click(rowBoxes()[2]!);
      expect(selectAll().checked).toBeTrue();
    });

    it('clicking a checked "Select all" clears the selection', () => {
      click(selectAll());
      click(selectAll());
      expect(rowBoxes().map(b => b.checked)).toEqual([ false, false, false ]);
      expect(selectAll().checked).toBeFalse();
    });
  });

  describe('with only ancestor-only managers', () => {
    beforeEach(() => setup([ manager('2', null) ]));

    it('"Select all" is disabled', () => {
      expect(selectAll().disabled).toBeTrue();
    });
  });
});
