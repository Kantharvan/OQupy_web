import { apiRequest } from "./client";

export type StudioType = "Dance" | "Fitness" | "Music" | "Art" | "Yoga";

export type Studio = {
  id: string;
  name: string;
  location: string;
  price: string;
  type: StudioType[];
  description?: string;
  images: string[];
  amenities: string[];
  instructors: { id: string; name: string; email: string }[];
  operationalHours?: Record<string, unknown>;
  cancellationPolicy: number;
  createdAt: string;
};

export type StudiosResponse = {
  data: Studio[];
  page: number;
  limit: number;
  total: number;
};

export type StudiosQuery = {
  search?: string;
  location?: string;
  // date/time filters — UI-ready, backend support pending (see contracts/studios.md)
  date?: string;       // YYYY-MM-DD
  startTime?: string;  // HH:mm
  endTime?: string;    // HH:mm
  page?: number;
  limit?: number;
};

export async function getOwnerStudios(ownerId: string, page = 1, limit = 50): Promise<StudiosResponse> {
  return apiRequest<StudiosResponse>(`/studios/owner/${ownerId}?page=${page}&limit=${limit}`);
}

export async function getStudios(query: StudiosQuery = {}): Promise<StudiosResponse> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.location) params.set("location", query.location);
  if (query.date) params.set("date", query.date);
  if (query.startTime) params.set("startTime", query.startTime);
  if (query.endTime) params.set("endTime", query.endTime);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const qs = params.toString();
  return apiRequest<StudiosResponse>(`/studios${qs ? `?${qs}` : ""}`);
}
