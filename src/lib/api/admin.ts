import { apiRequest } from "./client";
import type { Studio } from "./studios";
import type { User } from "./auth";

export type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  role: User["role"];
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastActive: string | null;
};

export type AdminUsersResponse = {
  data: AdminUser[];
  page: number;
  limit: number;
  total: number;
};

export async function getUsers(page = 1, limit = 100): Promise<AdminUsersResponse> {
  return apiRequest<AdminUsersResponse>(`/admin/users?page=${page}&limit=${limit}`);
}

export async function setUserRole(id: string, role: NonNullable<User["role"]>): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });
}

export type PendingStudio = Studio & {
  approvalStatus: "pending" | "approved" | "rejected";
  published: boolean;
  owner: { id: string; name: string; email: string };
};

export type PendingStudiosResponse = {
  data: PendingStudio[];
  page: number;
  limit: number;
  total: number;
};

export async function getPendingStudios(page = 1, limit = 50): Promise<PendingStudiosResponse> {
  return apiRequest<PendingStudiosResponse>(`/admin/studios/pending?page=${page}&limit=${limit}`);
}

export async function approveStudio(
  id: string,
  approvalStatus: "approved" | "rejected",
  approvalReason?: string
): Promise<PendingStudio> {
  return apiRequest<PendingStudio>(`/admin/studios/${id}/approval`, {
    method: "PATCH",
    body: { approvalStatus, approvalReason },
  });
}
