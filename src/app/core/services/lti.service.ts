import { Injectable } from '@angular/core';

/**
 * LTI stands for "Learning Tools Interoperability", which is implemented using a Provider-Consumer pattern
 * This service provides utilities to adapt the platform when run as LTI provider by holding all the necessary information
 */
@Injectable({
  providedIn: 'root',
})
export class LTIService {

  private url = new URL(location.hash.replace('#', ''), location.href);

  readonly isProvider = this.url.pathname === '/lti';
  readonly contentId = this.isProvider
    ? this.url.searchParams.get('content_id') || null // avoid empty string
    : null;

}
