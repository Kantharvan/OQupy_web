"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export function GoogleProvider({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
