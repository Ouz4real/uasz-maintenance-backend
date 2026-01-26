import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Demande } from '../models/demande.model';

@Injectable({
  providedIn: 'root'
})
export class DemandeService {

  private readonly API_URL = 'http://localhost:8080/api/pannes';

  constructor(private http: HttpClient) {}

  traiterParResponsable(
    panneId: number,
    technicienId: number,
    urgenceResponsable: 'BASSE' | 'MOYENNE' | 'HAUTE'
  ): Observable<Demande> {
    return this.http.patch<Demande>(
      `${this.API_URL}/${panneId}/traitement-responsable`,
      {
        technicienId,
        prioriteResponsable: urgenceResponsable
      }
    );
  }
}
