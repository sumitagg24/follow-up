import { useEffect } from "react";

const BASE = "Founder Follow-Up";

/** Sets a per-page document title; pass no argument for the root title. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} • ${BASE}` : BASE;
    return () => { document.title = BASE; };
  }, [title]);
}
