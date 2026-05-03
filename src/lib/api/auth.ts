import { apiRequest, clearTokens, getRefreshToken, setTokens } from "./client";

export type User = {
  id: string;
  phone: string | null;
  name: string | null;
  role: "studio_owner" | "instructor" | "student" | "admin" | null;
  email: string | null;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
  isNewUser: boolean;
};

export async function sendOTP(phone: string): Promise<void> {
  await apiRequest("/auth/send-otp", {
    method: "POST",
    body: { phone },
  });
}

export async function verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/auth/verify-otp", {
    method: "POST",
    body: { phone, otp },
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/auth/google", {
    method: "POST",
    body: { idToken },
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  await apiRequest("/auth/logout", {
    method: "POST",
    body: { refreshToken },
  }).catch(() => {});
  clearTokens();
}

export async function getMe(): Promise<User> {
  return apiRequest<User>("/auth/me");
}
