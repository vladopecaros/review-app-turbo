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

export interface Product {
  _id: string;
  externalProductId: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  metadata?: Record<string, unknown>;
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

export interface Review {
  _id: string;
  externalProductId?: string;
  productName?: string;
  organizationId: string;
  rating: number;
  text: string;
  reviewerName: string;
  reviewerEmail: string;
  status: 'published' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string | null;
}

export type InvitedUserRole = 'admin' | 'member';
