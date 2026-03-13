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
    demandeId: number,
    technicienId: number,
    urgence: string,
    statut?: string,
    commentaireInterne?: string
  ) {
    return this.http.put<Demande>(
      `${this.API_URL}/${demandeId}/traitement-responsable`,
      {
        technicienId,
        prioriteResponsable: urgence,
        statut,
        commentaireInterne
      }
    );
  }

}
