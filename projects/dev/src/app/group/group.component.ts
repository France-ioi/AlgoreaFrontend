import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../shared/services/api/group.service';
import { Group } from '../shared/models/group.model';
import { JoinMethod } from '../shared/constants/group';
import { StatusService } from '../shared/services/status.service';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

  groupdata;
  status;

  constructor(
    private activatedRoute: ActivatedRoute,
    private statusService: StatusService,
    private groupService: GroupService
  ) { }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    this.groupService.getManagedGroup(50).subscribe((group: Group) => {
      this.groupdata = {
        ID: group.id,
        name: group.name,
        type: group.type,
        website: 'www.lyceeloremipsum.com',
        assocActivity: {
          name: 'Concours castor 2019',
          link: 'www.france-ioi.com',
          progress: {
            displayedScore: 80,
            currentScore: 90
          }
        },
        assocSkill: {
          name: 'Concours castor 2018',
          link: 'www.france-ioi.com',
          progress: {
            displayedScore: 80,
            currentScore: 90
          }
        },
        location: '46  Chemin Du Lavarin Sud Cachan Île-de-France France',
        grades: group.grade,
        date: group.created_at,
        joinMethods: [
          JoinMethod.accessCode,
          JoinMethod.invitation
        ]
      };
    });

    this.statusService.getObservable().subscribe(res => {
      this.status = res;
    });
  }

}
