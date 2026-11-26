export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

export interface RegisterResponseData {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

