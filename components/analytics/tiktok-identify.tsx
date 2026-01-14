"use client";

import { useEffect, useRef } from "react";
import { identifyUser } from "lib/analytics/tiktok-pixel";
import { useUserSession } from "hooks/useUserSession";

export default function TikTokIdentify() {
  const { data: session } = useUserSession();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.email && !session?.phone && !session?.id) {
      return;
    }

    const key = `${session?.email || ""}|${session?.phone || ""}|${session?.id || ""}`;
    if (key === lastKeyRef.current) {
      return;
    }

    lastKeyRef.current = key;

    identifyUser({
      email: session?.email || undefined,
      phoneNumber: session?.phone || undefined,
      externalId: session?.id || undefined,
    });
  }, [session?.email, session?.phone, session?.id]);

  return null;
}
