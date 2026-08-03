import { apiRequest } from "./client";
import type { Studio } from "./studios";

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
