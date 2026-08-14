export interface AuthUser {
  userId: string;
  username: string;
  role: 'SUPER_ADMIN' | 'HOD' | 'STAFF' | 'STUDENT';
  name: string;
}
export interface LoginResponse {
  user: AuthUser;
  token: string;
}
