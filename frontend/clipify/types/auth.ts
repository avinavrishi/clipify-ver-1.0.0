export type UserRole = "CREATOR" | "BRAND" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface User {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: "bearer";
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

