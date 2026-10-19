import { apiRequest } from "./client";
import type { StudiosResponse } from "./studios";
export type Manager = {
  userId: string;
  user: { id: string; name: string; email: string | null };
};
export const getAssignedStudios = (page = 1) =>
  apiRequest<StudiosResponse>(
    `/studio-management/assigned?page=${page}&limit=100`,
  );
export const getManagers = (id: string) =>
  apiRequest<Manager[]>(`/studio-management/${id}/managers`);
export const addManager = (id: string, email: string) =>
  apiRequest(`/studio-management/${id}/managers`, {
    method: "POST",
    body: { email },
  });
export const removeManager = (id: string, userId: string) =>
  apiRequest(`/studio-management/${id}/managers/${userId}`, {
    method: "DELETE",
  });
export type Activity = {
  id: string;
  actorId: string;
  actor: { name: string; email: string | null } | null;
  action: string;
  targetId: string;
  createdAt: string;
};
export const getStudioActivity = (id: string, page = 1) =>
  apiRequest<{ data: Activity[]; total: number }>(
    `/studio-management/${id}/activity?page=${page}&limit=20`,
  );
