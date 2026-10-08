import { useEffect, useState } from "react";

/**
 * False during server render and the first client render, true after mount.
 * Use it for values that only the browser knows (e.g. a locally stored bag)
 * so server and client markup match during hydration.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
