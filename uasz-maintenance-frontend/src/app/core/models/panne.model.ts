import { EquipementApi } from './equipement.model';
import { UtilisateurApi } from './utilisateur.model';

export type PrioriteApi = 'BASSE' | 'MOYENNE' | 'HAUTE';
export type StatutPanneApi = 'OUVERTE' | 'EN_COURS' | 'RESOLUE';

export interface PanneApi {
  id: number;
  titre: string;
  description?: string;
  dateSignalement: string;
  statut: 'OUVERTE' | 'EN_COURS' | 'RESOLUE';
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE';
  prioriteResponsable?: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;
  typeEquipement?: string;
  lieu?: string;
  imagePath?: string | null; // ✅ IMPORTANT
  equipement?: { libelle?: string; localisation?: string } | null;
  technicien?: {
    id: number;
    nom?: string;
    prenom?: string;
  };
}


export interface PanneRequest {
  equipementId?: number;       // optionnel si AUTRE
  demandeurId?: number;

  titre: string;
  description: string;

  priorite?: PrioriteApi;
  statut?: StatutPanneApi;

  signaleePar?: string;

  // ✅ NOUVEAU
  typeEquipement: string;
  lieu: string;
}
