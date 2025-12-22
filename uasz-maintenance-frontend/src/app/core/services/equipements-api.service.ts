// src/app/core/services/equipements-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipementApi } from '../models/equipement.model';

@Injectable({
  providedIn: 'root',
})
export class EquipementsApiService {
  private readonly baseUrl = `${environment.apiUrl}/equipements`;

  constructor(private http: HttpClient) {}

  /** GET /api/equipements */
  getAll(): Observable<EquipementApi[]> {
    return this.http.get<EquipementApi[]>(this.baseUrl);
  }

  /** GET /api/equipements/{id} */
  getById(id: number): Observable<EquipementApi> {
    return this.http.get<EquipementApi>(`${this.baseUrl}/${id}`);
  }

  /** GET /api/equipements/code/{code} */
  getByCode(code: string): Observable<EquipementApi> {
    return this.http.get<EquipementApi>(`${this.baseUrl}/code/${encodeURIComponent(code)}`);
  }

  /** POST /api/equipements */
  create(payload: Partial<EquipementApi>): Observable<EquipementApi> {
    return this.http.post<EquipementApi>(this.baseUrl, payload);
  }

  /** PUT /api/equipements/{id} */
  update(id: number, payload: Partial<EquipementApi>): Observable<EquipementApi> {
    return this.http.put<EquipementApi>(`${this.baseUrl}/${id}`, payload);
  }

  /** DELETE /api/equipements/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
