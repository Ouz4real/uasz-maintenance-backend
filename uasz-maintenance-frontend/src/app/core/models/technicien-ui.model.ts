export interface TechnicienUI {
  id: number;
  nom: string;

  // ce que ton UI utilise parfois
  username?: string | null;

  serviceUnite?: string | null;
  categorie?: string | null;
  sousCategorie?: string | null;

  specialites: string[];

  disponible: boolean;
  nbInterventionsEnCours: number;
  nbInterventionsTerminees: number;
  tempsMoyenResolutionHeures: number;

  // pour ton template *ngIf="t.stats as s"
  stats?: {
    enCours?: number;
    terminees?: number;
    annulees?: number;
    planifiees?: number;
    tempsMoyenHeures?: number;
  } | null;
}
