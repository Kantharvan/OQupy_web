import { apiRequest } from "./client";

export type RecurringType = "none" | "weekly" | "bi_weekly" | "monthly";
export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type Blockout = {
  id: string;
  studioId: string;
  eventName: string;
  eventDescription?: string;
  dateTime: string;
  allDay: boolean;
  durationHours: number;
  recurringType: RecurringType;
  recurringDays: DayOfWeek[];
  recurringUntil?: string;
  recurringIndefinite: boolean;
  createdAt: string;
};

export type BlockoutsResponse = {
  data: Blockout[];
  page: number;
  limit: number;
  total: number;
};

export type CreateBlockoutDto = {
  studioId: string;
  eventName: string;
  eventDescription?: string;
  dateTime: string;
  allDay?: boolean;
  durationHours?: number;
  recurringType?: RecurringType;
  recurringDays?: DayOfWeek[];
  recurringUntil?: string;
  recurringIndefinite?: boolean;
};

export async function getBlockoutsByStudio(studioId: string, page = 1, limit = 50): Promise<BlockoutsResponse> {
  return apiRequest<BlockoutsResponse>(`/blockouts/studio/${studioId}?page=${page}&limit=${limit}`);
}

export async function createBlockout(dto: CreateBlockoutDto): Promise<Blockout> {
  return apiRequest<Blockout>("/blockouts", { method: "POST", body: dto });
}

export async function deleteBlockout(id: string): Promise<void> {
  return apiRequest<void>(`/blockouts/${id}`, { method: "DELETE" });
}
