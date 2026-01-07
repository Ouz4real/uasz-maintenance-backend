import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaintenancePreventive } from '../models/maintenance-preventive.model';

@Injectable({ providedIn: 'root' })
export class PreventivesService {
  private readonly apiRoot = environment.apiUrl; // ex: http://localhost:8080/api
  private readonly baseUrl = `${this.apiRoot}/maintenances-preventives`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MaintenancePreventive[]> {
    return this.http.get<MaintenancePreventive[]>(this.baseUrl);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }
}
