import { apiRequest } from "./client";

export type BookingStatus = "AwaitingApproval" | "Confirmed" | "Cancelled" | "Completed";
export type BookingType = "instructor_event" | "student_practice" | "owner_event";

export type Booking = {
  id: string;
  studioId: string;
  studioName: string;
  bookedBy: string;
  bookingType: BookingType;
  eventName: string;
  eventDescription?: string;
  dateTime: string;
  durationHours: number;
  status: BookingStatus;
  isPublic: boolean;
  clientName?: string;
  clientPhone?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  createdAt: string;
};

export type BookingsResponse = {
  data: Booking[];
  page: number;
  limit: number;
  total: number;
};

export type CreateBookingDto = {
  studioId: string;
  bookingType: BookingType;
  eventName: string;
  eventDescription?: string;
  dateTime: string;
  durationHours: number;
  clientName?: string;
  clientPhone?: string;
};

export async function getBookingsByStudio(studioId: string, page = 1, limit = 20): Promise<BookingsResponse> {
  return apiRequest<BookingsResponse>(`/bookings/studio/${studioId}?page=${page}&limit=${limit}`);
}

export async function createBooking(dto: CreateBookingDto): Promise<Booking> {
  return apiRequest<Booking>("/bookings", { method: "POST", body: dto });
}

export async function confirmBooking(id: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${id}/confirm`, { method: "PATCH" });
}

export async function cancelBooking(id: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${id}/cancel`, { method: "PATCH" });
}
