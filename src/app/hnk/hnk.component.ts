import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { Honorlock } from '@honorlock/integration-sdk-js';
import { combineLatest, filter, from, map, Subject, Subscription, switchMap, tap } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { HnkVerificationComponent } from '../hnk-verification/hnk-verification.component';

function destroyScope(): Subscription {
  const subscriptions = new Subscription();
  inject(DestroyRef).onDestroy(() => {
    subscriptions.unsubscribe();
  });
  return subscriptions;
}

const userToken = "...";
@Component({
  selector: 'alg-hnk',
  standalone: true,
  imports: [
    AsyncPipe,
    HnkVerificationComponent,
  ],
  templateUrl: './hnk.component.html',
  styleUrl: './hnk.component.scss'
})
export class HnkComponent implements OnInit {

  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private domSanitizer = inject(DomSanitizer);

  honorlock = new Honorlock();

  verified = signal<boolean>(false);

  launchScreenUrl$ = toObservable(this.verified).pipe(
    filter(verified => verified),
    switchMap(() => this.http.get('https://app.honorlock.com/api/en/v1/exams/321/instructions', {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${userToken}`
      }
    })), //TODO handle errors
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    map((resp: any) => this.domSanitizer.bypassSecurityTrustResourceUrl(resp.data.launch_screen_url as string)),
  );

  private sessionInfo$ = toObservable(this.verified).pipe(
    filter(verified => verified),
    switchMap(() => this.http.post('https://app.honorlock.com/api/en/v1/exams/sessions/create',
      {
        "exam_taker_id": "34244",
        "exam_taker_email": "uscer@example.com",
        "exam_taker_full_name": "mys stud name",
        "external_exam_id": "321",
        "exam_taker_attempt_id": "0"
      }, {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${userToken}`
        }
      }
    )), // TODO handle errors
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    map((resp: any) => resp.data),
  );

  private sessionSetup$ = combineLatest([ this.sessionInfo$, this.launchScreenUrl$ ]).pipe(
    switchMap(([ sessionInfo ]) => {
      console.log("sessionInfo", sessionInfo)
      return this.honorlock.setupSession(
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
          session: sessionInfo,
          app_url: "http://192.168.88.252:4200",
          external_exam_id: '321',
          exam_taker_id: '34244',
          exam_taker_name: 'mys stud name',
          exam_taker_attempt_id: '0',
          //Optionally: Add an additional domain or URL that will be proctored during the test taking experience.
          //additionally_supported_url: 'https://my-other-platform.com',
        }
      )
      })
  );

  private onBeginExam$ = new Subject<void>();
  authenticated$ = this.onBeginExam$.pipe(
    switchMap(() => this.http.get('https://app.honorlock.com/api/en/v1/exams/321/sessions/34244/0/verify', {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${userToken}`
      }
    })), //TODO handle errors
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    map((resp: any) => resp.data.authenticated as boolean),
  );
  authenticationCompleted = toSignal(this.authenticated$.pipe(map(() => true)), { initialValue: false });
  authenticationError$ = this.authenticated$.pipe(
    filter(authenticated => !authenticated),
  );
  authenticationSuccess$ = this.authenticated$.pipe(
    filter(authenticated => authenticated)
  );
  beginExamSession$ = this.authenticationSuccess$.pipe(
    switchMap(() => this.http.post('https://app.honorlock.com/api/en/v1/session/start', {
      "external_exam_id": "321",
      "exam_taker_id": "34244",
      "exam_taker_attempt_id": "0"
    }, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${userToken}`
      }
    })), //TODO handle errors
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    map((resp: any) => resp.data),
  );



  message = signal<string>('');

  constructor() {

    destroyScope().add(this.sessionSetup$.subscribe(() => {
      console.log("sessionSetup")
    }));
        //improv : see https://angular.fr/technical/destroy-ref.html
  }

  extensionVerified(): void {
    this.verified.set(true);
  }

  extensionVerificationError(): void {
    // TODO
  }

  ngOnInit(): void {
    this.honorlock.onBeginExam(() => {
      this.message.set(this.message() + "\nbeginExam");
      this.onBeginExam$.next();
    });
    this.honorlock.onExamLoaded(() => {
      this.message.set(this.message() + "\nexamLoaded");
    });

    this.honorlock.onExamSubmit(() => {
      this.message.set(this.message() + "\nexamSubmit");
    });
  }

  examLoaded(): void {
    this.honorlock.examLoaded();
  }
  questionLoaded(): void {
    this.honorlock.questionLoaded('1', "klmlm", "")
  }

  endExam(): void {
    this.honorlock.examSubmit();
    this.http.post('https://app.honorlock.com/api/en/v1/session/complete', {
      "external_exam_id": "321",
      "exam_taker_id": "34244",
      "exam_taker_attempt_id": "0"
    }, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${userToken}`
      }
    }).subscribe({
      next: () => this.message.set(this.message() + "\nendExam"),
      error: (err) => this.message.set(this.message() + "\nendExam error:"+err),
    });
  }
}
