import { apiRequest } from "./client";
import { type User } from "./auth";

type UpdateProfileDto = {
  role?: NonNullable<User["role"]>;
  name?: string;
};

export async function updateUserProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
  return apiRequest<User>(`/users/${userId}`, {
    method: "PUT",
    body: dto,
  });
}

export async function updateUserRole(userId: string, role: NonNullable<User["role"]>): Promise<User> {
  return updateUserProfile(userId, { role });
}
