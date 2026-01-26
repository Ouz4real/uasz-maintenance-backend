import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PanneApi } from '../models/panne.model';
import {Panne} from './panne';

@Injectable({
  providedIn: 'root'
})
export class PannesService {

  private readonly apiUrl = 'http://localhost:8080/api/pannes';

  constructor(private http: HttpClient) {}

  /** 🔹 Pannes EN_COURS d’un technicien */
  getEnCoursByTechnicien(technicienId: number): Observable<Panne[]> {
    return this.http.get<Panne[]>(
      `${this.apiUrl}/technicien/${technicienId}/en-cours`
    );
  }
}
