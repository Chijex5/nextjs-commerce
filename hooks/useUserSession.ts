"use client";

import { useState, useEffect } from "react";
import { UserSession } from "lib/user-session";

export function useUserSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/user-auth/session");
      const data = await response.json();
      
      if (data.user) {
        setSession(data.user);
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch (error) {
      setSession(null);
      setStatus("unauthenticated");
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/user-auth/logout", { method: "POST" });
      setSession(null);
      setStatus("unauthenticated");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    data: session,
    status,
    signOut,
    refetch: fetchSession,
  };
}
