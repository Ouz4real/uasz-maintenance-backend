export interface User {
  id: number;
  username: string;
  email: string;
  role: 'DEMANDEUR' | 'TECHNICIEN' | 'RESPONSABLE_MAINTENANCE' | 'SUPERVISEUR' | 'ADMIN';
}
