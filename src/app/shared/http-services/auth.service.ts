import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  getToken() {
    return 'token20';
    // return 'token11';
  }
}
