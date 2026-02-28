export interface User {
  id: string;
  email: string;
  role: 'user' | 'organization-admin' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
}

export interface OrganizationMembership {
  _id: string;
  userId: string;
  role: string;
  status: string;
  organizationId?: string;
  invitationId?: string;
}

export interface Invitation {
  _id: string;
  userId: string;
  role: 'admin' | 'member';
  status: 'invited' | 'active';
}

export interface AuthResponse {
  user: User;
  accessToken: string | null;
}

export type InvitedUserRole = 'admin' | 'member';
