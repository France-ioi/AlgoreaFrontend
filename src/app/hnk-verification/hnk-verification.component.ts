import { Component, inject, input, OnInit, output } from '@angular/core';
import { Honorlock } from '@honorlock/integration-sdk-js';
import { from, map, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DestroyRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';

const userToken = "...";

@Component({
  selector: 'alg-hnk-verification',
  standalone: true,
  imports: [
    AsyncPipe
  ],
  templateUrl: './hnk-verification.component.html',
  styleUrl: './hnk-verification.component.scss'
})
export class HnkVerificationComponent implements OnInit {
  verified = output<void>();
  error = output<unknown>();

  honorlock = input.required<Honorlock>();

  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private domSanitizer = inject(DomSanitizer);

  private init$ = toObservable(this.honorlock).pipe(
    map(honorlock => honorlock.init())
  );

  private initErrorSubscription = this.init$.subscribe({
    error: e => this.error.emit(e)
    // TODO: take until destroyed
  });


  private extensionCheck$ = this.init$.pipe(
    switchMap(() => this.http.get('https://app.honorlock.com/api/en/v1/extension/check', {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${userToken}`
      }
    })), //TODO handle errors
  );

  iframeUrl$ = this.extensionCheck$.pipe(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    map((resp: any) => {
      console.log("extensionCheck response", resp)
      return this.domSanitizer.bypassSecurityTrustResourceUrl(resp.data.iframe_src as string);
    })
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.initErrorSubscription.unsubscribe();
    });
  }

  ngOnInit(): void {
    this.honorlock().onExtensionVerified(() => {
      this.verified.emit();
    });
  }

}
