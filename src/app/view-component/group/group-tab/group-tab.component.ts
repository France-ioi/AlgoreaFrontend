import { Component, OnInit, ElementRef, EventEmitter, Output } from '@angular/core';
import { NodeService } from 'src/app/services/node-service.service';

@Component({
  selector: 'app-group-tab',
  templateUrl: './group-tab.component.html',
  styleUrls: ['./group-tab.component.scss']
})
export class GroupTabComponent implements OnInit {

  @Output() expandWholeWidth = new EventEmitter<void>();

  gridData;
  columns;
  grdata;

  selectedPolicy = 0;

  childrenPolicy = [
    {
      label: 'Direct Children Only'
    },
    {
      label: 'All descendants'
    }
  ];

  selItems = [
    {
      icon: 'fa fa-users',
      label: 'sub-groups'
    },
    {
      icon: 'fa fa-calendar',
      label: 'sessions'
    },
    {
      icon: 'fa fa-users',
      label: 'teams'
    },
    {
      icon: 'fa fa-user',
      label: 'users'
    }
  ];

  yesNo = [
    {
      label: 'Yes'
    },
    {
      label: 'No'
    }
  ];

  subgroup = [
    {
      label: 'School',
      icon: 'School.svg',
      disabled: true
    },
    {
      label: 'Class',
      icon: 'Group.svg'
    },
    {
      label: 'Folder',
      icon: 'Team.svg'
    },
    {
      label: 'Team',
      icon: 'Team.svg'
    }
  ];

  subgriddata = [
    {
      ID: 1,
      col1: 'Prefix-1',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    },
    {
      ID: 2,
      col1: 'Prefix-2',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    },
    {
      ID: 3,
      col1: 'Prefix-3',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    },
    {
      ID: 4,
      col1: 'Prefix-4',
      col2: '1356 generated codes',
      col3: '03/04/2018'
    }
  ];

  subgridcols = ['col1', 'col2', 'col3'];

  showDialog;
  trees;

  constructor(
    private elementRef: ElementRef,
    private nodeService: NodeService
  ) { }

  ngOnInit() {
    this.nodeService.getCarHuge().subscribe(res => {
      this.gridData = res.data;
      this.columns = [
        { field: 'vin', header: 'Vin' },
        { field: 'year', header: 'Year' },
        { field: 'brand', header: 'Brand' },
        { field: 'color', header: 'Color' },
        { field: 'vin1', header: 'Vin1' },
        { field: 'year1', header: 'Year1' },
        { field: 'brand1', header: 'Brand1' },
        { field: 'color1', header: 'Color1' }
      ];
      this.grdata = [
        {
          name: 'Epreuves',
          columns: this.columns
        }
      ]
    });
    this.nodeService.getFiles().then(res => {
      this.trees = res;
      console.log(this.trees);
    });
  }

  onTabChange(e) {
    const tabs = this.elementRef.nativeElement.querySelectorAll('.mat-tab-labels .mat-tab-label');
    let i;
    const activeTab = this.elementRef.nativeElement.querySelector('.mat-tab-labels .mat-tab-label.mat-tab-label-active');
    tabs.forEach((tab) => {
      tab.classList.remove('mat-tab-label-before-active');
    });

    for (i = 0 ; i < tabs.length ; i++) {
      if (tabs[i] === activeTab) {
        break;
      }
    }

    if (i > 0) {
      tabs[i - 1].classList.add('mat-tab-label-before-active');
    }
  }

  onExpandWidth(e) {
    this.expandWholeWidth.emit(e);
  }

  onChildrenPolicyChanged(idx) {
    this.selectedPolicy = idx;
  }

}
