import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Api {

  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  testConnection(): Observable<string> {
    return this.http.get(this.apiUrl, {
      responseType: 'text'
    });
  }
}