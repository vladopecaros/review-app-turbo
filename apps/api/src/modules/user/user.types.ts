export type UserRole = 'user' | 'admin' | 'organization-admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
