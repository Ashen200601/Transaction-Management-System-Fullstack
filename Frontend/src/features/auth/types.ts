export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
