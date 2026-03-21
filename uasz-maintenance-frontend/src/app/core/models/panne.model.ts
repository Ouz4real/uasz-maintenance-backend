import { EquipementApi } from './equipement.model';
import { UtilisateurApi } from './utilisateur.model';

export type PrioriteApi = 'BASSE' | 'MOYENNE' | 'HAUTE';
export type StatutPanneApi = 'OUVERTE' | 'EN_COURS' | 'RESOLUE';

/** ✅ NOUVEAU : statut de l’intervention */
export type StatutInterventionsApi =
  | 'NON_DEMARREE'
  | 'EN_COURS'
  | 'TERMINEE'
  | 'ANNULEE';

export interface PanneApi {
  id: number;
  titre: string;
  description?: string;
  dateSignalement: string;

  statut: StatutPanneApi;
  priorite: PrioriteApi;
  prioriteResponsable?: PrioriteApi | null;

  /** ✅ AJOUT OBLIGATOIRE */
  statutInterventions?: StatutInterventionsApi;

  typeEquipement?: string;
  lieu?: string;
  imagePath?: string | null;
  
  /** ✅ Commentaire interne du responsable */
  commentaireInterne?: string | null;
  
  /** ✅ Nom de la personne qui a signalé la panne */
  signaleePar?: string | null;

  /** ✅ Note du technicien après intervention */
  noteTechnicien?: string | null;

  /** ✅ Pièces utilisées (format JSON) */
  piecesUtilisees?: string | null;

  /** ✅ Image après résolution (technicien) */
  imageResolutionPath?: string | null;

  /** ✅ Date de la dernière relance */
  dateDerniereRelance?: string | null;

  equipement?: {
    libelle?: string;
    localisation?: string;
  } | null;

  technicien?: {
    id: number;
    nom?: string;
    prenom?: string;
  };
}

export interface PanneRequest {
  equipementId?: number;
  demandeurId?: number;

  titre: string;
  description: string;

  priorite?: PrioriteApi;
  statut?: StatutPanneApi;

  signaleePar?: string;

  typeEquipement: string;
  lieu: string;
}
