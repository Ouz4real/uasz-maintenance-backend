// technicien-ui.model.ts
export interface TechnicienUI {
  id: number;
  nom: string;
  username?: string | null;

  serviceUnite?: string | null;
  categorie?: string | null;
  sousCategorie?: string | null;

  specialites: string[];

  disponible: boolean;
  nbInterventionsEnCours: number;
  nbInterventionsTerminees: number;
  tempsMoyenResolutionHeures: number;

  // ✅ OBLIGATOIRE
  occupe: boolean;

  stats?: {
    enCours?: number;
    terminees?: number;
    annulees?: number;
    planifiees?: number;
    tempsMoyenHeures?: number;
  } | null;

  interventionsEnCours?: any[];
  dernieresInterventions?: any[];

  // ✅ états UI
  loadingInterventions?: boolean;
  errorInterventions?: any;
  loadingStats?: boolean;
  errorStats?: any;
}

