export interface AuthRequest {
  usernameOrEmail: string;
  motDePasse: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  email: string;
  role: 'DEMANDEUR' | 'TECHNICIEN' | 'RESPONSABLE_MAINTENANCE' | 'SUPERVISEUR' | 'ADMIN';
}
