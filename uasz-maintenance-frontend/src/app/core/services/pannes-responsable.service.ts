import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type StatutPanneApi = 'OUVERTE' | 'EN_COURS' | 'RESOLUE';
export type PrioriteApi = 'BASSE' | 'MOYENNE' | 'HAUTE';

export interface PanneDto {
  id: number;
  titre: string;
  lieu: string;
  typeEquipement: string;
  description: string;

  priorite: PrioriteApi | null;
  statut: StatutPanneApi;

  // ✅ AJOUTE ÇA (c’est ce que ton backend remplit)
  dateSignalement?: string | null;

  // existants
  dateCreation?: string;
  createdAt?: string;

  imageUrl?: string | null;
  imagePath?: string | null;

  demandeur?: { id: number; prenom?: string; nom?: string };
  signaleePar?: string | null;
}


export interface TechnicienOptionDto {
  id: number;
  nom: string;
  categorie?: string | null;
  disponible?: boolean | null;
}

export interface TraitementPanneRequest {
  // actuellement ton backend n’a pas encore un endpoint "traitement"
  // on garde la structure pour ton UI, mais on applique ce qu’on peut (statut)
  statut?: StatutPanneApi;
  priorite?: PrioriteApi | null;

  technicienId?: number | null;
  commentaire?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PannesResponsableService {
  private readonly apiRoot = environment.apiUrl; // ✅ ex: http://localhost:8080/api
  private readonly pannesUrl = `${this.apiRoot}/pannes`;

  constructor(private http: HttpClient) {}

  /** ✅ Toutes les pannes */
  getAllPannes(): Observable<PanneDto[]> {
    return this.http.get<PanneDto[]>(this.pannesUrl);
  }

  /** ✅ Mes pannes (endpoint existant chez toi: /mes-pannes) */
  getMyPannes(): Observable<PanneDto[]> {
    return this.http.get<PanneDto[]>(`${this.pannesUrl}/mes-pannes`);
  }

  /** ✅ Créer une panne (multipart) */
  createPanne(formData: FormData): Observable<PanneDto> {
    return this.http.post<PanneDto>(this.pannesUrl, formData);
  }

  /** ✅ Changer statut (endpoint existant: PATCH /{id}/statut?statut=...) */
  updateStatut(id: number, statut: StatutPanneApi): Observable<PanneDto> {
    const params = new HttpParams().set('statut', statut);
    return this.http.patch<PanneDto>(`${this.pannesUrl}/${id}/statut`, null, { params });
  }

  /**
   * ✅ "Traiter" (compat UI)
   * Ton backend ne fournit pas /traitement pour l’instant.
   * => ici on applique seulement le statut si fourni.
   * Les champs priorite/technicienId/commentaire seront branchés plus tard quand tu ajoutes l’endpoint côté Spring.
   */
  traiterPanne(id: number, payload: TraitementPanneRequest): Observable<PanneDto> {
    if (payload?.statut) {
      return this.updateStatut(id, payload.statut);
    }
    // fallback: renvoyer la panne inchangée (évite crash UI)
    return this.http.get<PanneDto>(`${this.pannesUrl}/${id}`);
  }

  updatePrioriteResponsable(
    id: number,
    priorite: 'BASSE' | 'MOYENNE' | 'HAUTE'
  ): Observable<PanneDto> {
    const params = new HttpParams().set('priorite', priorite);
    return this.http.patch<PanneDto>(`${this.pannesUrl}/${id}/priorite-responsable`, null, { params });
  }



  /**
   * ✅ Liste techniciens
   * À adapter à ton vrai endpoint.
   * Si ton backend expose /api/utilisateurs?role=TECHNICIEN => OK.
   */
  getTechniciens(): Observable<TechnicienOptionDto[]> {
    const params = new HttpParams().set('role', 'TECHNICIEN');
    return this.http.get<TechnicienOptionDto[]>(`${this.apiRoot}/utilisateurs`, { params });
  }


}
