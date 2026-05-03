import { apiRequest } from "./client";
import { type User } from "./auth";

export async function updateUserRole(
  userId: string,
  role: NonNullable<User["role"]>
): Promise<User> {
  return apiRequest<User>(`/users/${userId}`, {
    method: "PATCH",
    body: { role },
  });
}
