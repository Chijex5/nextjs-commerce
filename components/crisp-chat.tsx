"use client";

import { useEffect } from "react";

export function CrispChat() {
  useEffect(() => {
    // Only load if CRISP_WEBSITE_ID is configured
    const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    
    if (!crispWebsiteId) {
      console.log("Crisp chat not configured. Set NEXT_PUBLIC_CRISP_WEBSITE_ID to enable.");
      return;
    }

    // Crisp chat widget script
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = crispWebsiteId;

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.getElementsByTagName("head")[0]?.appendChild(script);

    return () => {
      // Cleanup on unmount
      if ((window as any).$crisp) {
        delete (window as any).$crisp;
        delete (window as any).CRISP_WEBSITE_ID;
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
}
