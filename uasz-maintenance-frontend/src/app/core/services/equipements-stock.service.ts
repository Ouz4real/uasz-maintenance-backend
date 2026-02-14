import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EquipementStockRowDto {
  typeId: number;
  type: string;
  quantiteTotale: number;
  enService: number;
  horsService: number;
}

export interface EquipementItemDto {
  id: number;
  statut: string;
  localisation: string | null;
  dateMiseEnService: string | null;

  interventionId?: number | null; // ✅ AJOUT
}


export interface EquipementStockDetailsDto {
  typeId: number;
  type: string;
  description: string | null;
  dateAcquisition: string | null;

  total: number;
  enService: number;
  horsService: number;

  items: EquipementItemDto[];
}

export interface EquipementDetailsDto {
  typeId: number;
  type: string;

  description: string | null;
  dateAcquisition: string | null;

  total: number;
  enService: number;
  horsService: number;

  enServiceItems: EquipementItemDto[];
}



// ✅ Payload pour créer un type + une quantité d'items
export interface CreateTypeWithQuantityRequest {
  libelle: string;
  description?: string;
  quantite: number;
  localisation: string;
  statut: 'EN_SERVICE' | 'HORS_SERVICE';
}

@Injectable({ providedIn: 'root' })
export class EquipementStockService {
  private readonly apiRoot = environment.apiUrl; // ex: http://localhost:8080/api
  private readonly baseUrl = `${this.apiRoot}/stock-equipements`;  // ⚠️ adapte si ton controller a un autre mapping

  constructor(private http: HttpClient) {}

  getStock(): Observable<EquipementStockRowDto[]> {
    return this.http.get<EquipementStockRowDto[]>(this.baseUrl);
  }

  getDetails(typeId: number): Observable<EquipementDetailsDto> {
    return this.http.get<EquipementDetailsDto>(`${this.baseUrl}/${typeId}/details`);
  }


  // ✅ AJOUT : créer un type + X exemplaires (items)
  createTypeWithQuantity(payload: { libelle: string; description?: string | null; quantite: number }) {
    return this.http.post<void>(this.baseUrl, payload);
  }


  // ✅ OPTIONNEL : ajouter des items à un type existant (si tu fais plus tard)
  addItems(
    typeId: number,
    payload: { quantite: number; localisation: string; statut: 'EN_SERVICE' | 'HORS_SERVICE' }
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/${typeId}/items`, payload);
  }
}
