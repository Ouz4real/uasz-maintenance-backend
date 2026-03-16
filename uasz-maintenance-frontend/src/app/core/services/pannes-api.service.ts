import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { PanneApi } from '../models/panne.model';

@Injectable({ providedIn: 'root' })
export class PannesApiService {
  private baseUrl = `${environment.apiUrl}/pannes`;

  constructor(private http: HttpClient) {}

  getMesPannes(): Observable<PanneApi[]> {
    return this.http.get<PanneApi[]>(`${this.baseUrl}/mes-pannes`);
  }

  getPanneById(id: number): Observable<PanneApi> {
    return this.http.get<PanneApi>(`${this.baseUrl}/${id}`);
  }

  // ✅ multipart/form-data
  createPanne(formData: FormData): Observable<PanneApi> {
    return this.http.post<PanneApi>(this.baseUrl, formData);
  }
}
