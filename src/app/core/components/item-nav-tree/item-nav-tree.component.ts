import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Router } from '@angular/router';
import * as _ from 'lodash-es';

interface Item {  // to be moved to the service
  id: string,
  title: string
  type: string,
  ring: boolean,
  state: string,
  progress: any,
  children?: any,
  category?: any,
}

// ItemTreeNode is PrimeNG tree node with data forced to be an item
interface ItemTreeNode extends TreeNode {
  data: Item
  target: string
}

@Component({
  selector: 'alg-item-nav-tree',
  templateUrl: './item-nav-tree.component.html',
  styleUrls: ['./item-nav-tree.component.scss']
})
export class ItemNavTreeComponent implements OnChanges, OnInit {
  @Input() items: Item[] = [
    {
      id: '26',
      title: 'Activities to test mosaic/list modes',
      type: 'folder',
      ring: true,
      state: 'never opened',
      progress: {
        displayedScore: 0,
        currentScore: 0
      },
      children: [
        {
          id: 42,
          title: 'Activity with session list',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 30,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        },
        {
          id: 43,
          title: 'Activity with mosaic view',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 20,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        },
        {
          id: 44,
          title: 'Activity with presentation view',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 20,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        }
      ],
      category: {
        icon: 'fa fa-book-open',
        type: 0
      }
    },
    {
      id: '37',
      title: 'Activities to test headers',
      type: 'folder',
      ring: true,
      state: 'opened',
      progress: {
        displayedScore: 20,
        currentScore: 20
      },
      children: [
        {
          id: 38,
          title: 'Activity with access code',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 30,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        },
        {
          id: 39,
          title: 'Before you start notice',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 20,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        },
        {
          id: 40,
          title: 'Activity for teams',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 90,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        },
        {
          id: 41,
          title: 'Activity with attempts',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 10,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        }
      ]
    },
    {
      id: '27',
      title: 'Reduce graph size',
      type: 'folder',
      ring: true,
      state: 'opened',
      progress: {
        displayedScore: 90,
        currentScore: 90
      },
      children: [
        {
          id: 28,
          title: 'Simplify or optimize manipulation',
          type: 'leaf',
          ring: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 30,
            currentScore: 30
          },
          weight: 1,
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        },
        {
          id: 29,
          title: 'Spot symetry an convert to normal form',
          type: 'folder',
          ring: true,
          state: 'opened',
          progress: {
            displayedScore: 70,
            currentScore: 70
          },
          weight: 4,
          category: {
            icon: 'fa fa-video',
            type: 2
          },
          children: [
            {
              id: 30,
              title: 'Simplify or optimize manipulation',
              type: 'leaf',
              ring: true,
              state: 'opened',
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              weight: 2,
              category: {
                icon: 'fa fa-book-open',
                type: 0
              }
            },
            {
              id: 31,
              title: 'Spot symetry an convert to normal form',
              type: 'leaf',
              ring: true,
              state: 'opened',
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              weight: 3,
              category: {
                icon: 'fa fa-book-open',
                type: 4
              }
            }
          ]
        },
        {
          id: '32',
          title: 'Simplify or optimize manipulation',
          type: 'leaf',
          ring: true,
          state: 'opened',
          isLocked: true,
          progress: {
            displayedScore: 30,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-laptop-code',
            type: 3
          }
        },
        {
          id: '33',
          title: 'Spot symetry an convert to normal form',
          type: 'folder',
          ring: true,
          state: 'opened',
          progress: {
            displayedScore: 70,
            currentScore: 70
          },
          category: {
            icon: 'fa fa-code',
            type: 4
          },
          children: [
            {
              id: 34,
              title: 'Simplify or optimize manipulation',
              type: 'leaf',
              ring: true,
              state: 'opened',
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              category: {
                icon: 'fa fa-book-open',
                type: 3
              }
            },
            {
              id: 35,
              title: 'Spot symetry an convert to normal form',
              type: 'leaf',
              ring: true,
              state: 'opened',
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              category: {
                icon: 'fa fa-book-open',
                type: 3
              }
            }
          ]
        }
      ]
    },
    {
      id: '36',
      title: 'Horizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal '
           + 'digging (BFS) et DijkstraHorizontal digging (BFS) et Dijkstra',
      type: 'leaf',
      ring: true,
      state: 'locked',
      progress: {
        displayedScore: 20,
        currentScore: 20
      }
    }
  ];
  nodes: ItemTreeNode[];

  constructor(private router: Router) {}

  ngOnInit() { // to be removed
    this.nodes = _.map(this.items, (i) => {
      return {
        label: i.title,
        data: i,
        type: 'leaf',
        leaf: true,
        target: `/groups/details/${i.id}`,
      };
    });
  }

  ngOnChanges(_changes: SimpleChanges) {
    this.nodes = _.map(this.items, (i) => {
      return {
        label: i.title,
        data: i,
        type: 'leaf',
        leaf: true,
        target: `/groups/details/${i.id}`,
      };
    });
  }

  onSelect(_e, _node: ItemTreeNode) {
    // void this.router.navigate([node.target]);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      const element: HTMLElement = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label'
      );
      element.click();
    } else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.stopPropagation();
      e.preventDefault();
      const element: HTMLElement = document.activeElement.querySelector(
        '.ui-treenode-label .node-tree-item > .node-item-content > .node-label'
      );
      element.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      });
    }
  }

}
