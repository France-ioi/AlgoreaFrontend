import { Component, OnInit, Input } from '@angular/core';
import { NodeService } from 'projects/design/src/app/services/node-service.service';

@Component({
  selector: 'app-group-manage',
  templateUrl: './group-manage.component.html',
  styleUrls: ['./group-manage.component.scss']
})
export class GroupManageComponent implements OnInit {

  @Input() requests;
  @Input() columns;
  @Input() panel;

  gridData;
  grdata;
  grcols;

  trees;

  constructor(
    private nodeService: NodeService
  ) { }

  ngOnInit() {
    this.nodeService.getCarHuge().subscribe(res => {
      this.gridData = res.data;
      this.grcols = [
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
      ];
    });

    this.nodeService.getFiles().then(res => {
      this.trees = res;
    });
  }

  onExpandWidth(e) {

  }

}
