import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavTreeData, NavTreeElement } from '../../models/left-nav-loading/nav-tree-data';
import { EntityPathRoute } from '../../models/routing/entity-route';
import { LeftNavTreeComponent } from './left-nav-tree.component';

function route(id: string, path: string[]): EntityPathRoute {
  return { contentType: 'activity', id, path };
}

function element(id: string, path: string[], props: Partial<NavTreeElement>): NavTreeElement {
  return { route: route(id, path), title: id, hasChildren: false, navigateTo: (): void => {}, ...props };
}

/**
 * Tree:
 *   selected-chapter (selected, children loaded)
 *     child-task
 *     child-chapter (has children, not loaded)
 *   other-chapter (has children, not loaded)
 */
function buildData(): NavTreeData {
  const children = [
    element('child-task', [ 'root', 'selected-chapter' ], { itemType: 'Task' }),
    element('child-chapter', [ 'root', 'selected-chapter' ], { itemType: 'Chapter', hasChildren: true }),
  ];
  const elements = [
    element('selected-chapter', [ 'root' ], { itemType: 'Chapter', hasChildren: true, children }),
    element('other-chapter', [ 'root' ], { itemType: 'Chapter', hasChildren: true }),
  ];
  return new NavTreeData(elements, [ 'root' ], undefined, route('selected-chapter', [ 'root' ]));
}

describe('LeftNavTreeComponent', () => {
  let fixture: ComponentFixture<LeftNavTreeComponent>;

  function treeNode(title: string): HTMLElement {
    const nodes = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('cdk-nested-tree-node'));
    const node = nodes.find(n => n.querySelector(':scope > .tree-nav-wrapper .tree-nav-caption')?.textContent?.trim() === title);
    if (!node) throw new Error(`no tree node titled ${title}`);
    return node;
  }

  function childrenVisible(title: string): boolean {
    return !treeNode(title).querySelector(':scope > .tree-nested')!.classList.contains('tree-invisible');
  }

  /** The invariant under test: the CDK's aria-expanded agrees with whether the children are shown. */
  function expectExpanded(title: string, expanded: boolean): void {
    expect(childrenVisible(title)).withContext(`${title} children visible`).toBe(expanded);
    expect(treeNode(title).getAttribute('aria-expanded')).withContext(`${title} aria-expanded`).toBe(String(expanded));
  }

  function clickChevron(title: string): void {
    treeNode(title).querySelector<HTMLElement>(':scope > .tree-nav-wrapper .tree-nav-chevron i')!.click();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ LeftNavTreeComponent ],
    }).compileComponents();
    fixture = TestBed.createComponent(LeftNavTreeComponent);
    fixture.componentRef.setInput('data', buildData());
    await settle();
  });

  it('exposes an aria-expanded matching the visible state of expandable nodes', () => {
    expectExpanded('selected-chapter', true);

    expectExpanded('other-chapter', false);

    expect(treeNode('child-chapter').getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps aria-expanded in sync with the visible state when the selected folder is toggled', async () => {
    clickChevron('selected-chapter');
    await settle();
    expectExpanded('selected-chapter', false);

    clickChevron('selected-chapter');
    await settle();
    expectExpanded('selected-chapter', true);
  });

  it('keeps aria-expanded matching the (unchanged) visible state when arrow keys are used', async () => {
    const tree = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('cdk-tree')!;
    const pressOn = async (title: string, key: string): Promise<void> => {
      treeNode(title).focus();
      tree.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await settle();
    };

    await pressOn('selected-chapter', 'ArrowLeft');
    expectExpanded('selected-chapter', true);

    await pressOn('other-chapter', 'ArrowRight');
    expectExpanded('other-chapter', false);
  });

  it('renders the new children and expansion when the data changes for the same items', async () => {
    const newChildren = [ element('new-child', [ 'root', 'other-chapter' ], { itemType: 'Task' }) ];
    const elements = [
      element('selected-chapter', [ 'root' ], { itemType: 'Chapter', hasChildren: true }),
      element('other-chapter', [ 'root' ], { itemType: 'Chapter', hasChildren: true, children: newChildren }),
    ];
    fixture.componentRef.setInput('data', new NavTreeData(elements, [ 'root' ], undefined, route('other-chapter', [ 'root' ])));
    await settle();

    expect(treeNode('new-child')).toBeTruthy();
    expectExpanded('other-chapter', true);
    expectExpanded('selected-chapter', false);
  });

  it('does not expose aria-expanded on non-expandable nodes', () => {
    expect(treeNode('child-task').hasAttribute('aria-expanded')).toBeFalse();
  });
});
