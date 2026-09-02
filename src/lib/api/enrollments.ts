import { apiRequest } from "./client";

export type Enrollment = {
  id: string;
  bookingId: string;
  studentId: string;
  enrolledAt: string;
};

export type EnrollmentsResponse = {
  data: Enrollment[];
  page: number;
  limit: number;
  total: number;
};

export async function enroll(bookingId: string): Promise<Enrollment> {
  return apiRequest<Enrollment>("/enrollments", { method: "POST", body: { bookingId } });
}

export async function getStudentEnrollments(studentId: string, page = 1, limit = 50): Promise<EnrollmentsResponse> {
  return apiRequest<EnrollmentsResponse>(`/enrollments/student/${studentId}?page=${page}&limit=${limit}`);
}

export async function getBookingEnrollments(bookingId: string, page = 1, limit = 100): Promise<EnrollmentsResponse> {
  return apiRequest<EnrollmentsResponse>(`/enrollments/booking/${bookingId}?page=${page}&limit=${limit}`);
}

export async function unenroll(bookingId: string, studentId: string): Promise<void> {
  return apiRequest<void>(`/enrollments/${bookingId}/students/${studentId}`, { method: "DELETE" });
}
