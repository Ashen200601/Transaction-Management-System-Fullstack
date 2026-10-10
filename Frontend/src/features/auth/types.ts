export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface LoginCredentials {
  username: string;
  password: string;
}
