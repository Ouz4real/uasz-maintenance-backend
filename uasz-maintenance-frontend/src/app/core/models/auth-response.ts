// src/app/core/models/auth-response.ts
export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}
