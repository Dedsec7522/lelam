"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { filtersFromSearchParams, runSearch, type FilterInput } from "@/lib/run-search";
import { Marketplace } from "./marketplace";

/**
 * Marketplace for the static GitHub Pages build: the same search code the server runs,
 * executed in the browser against the generated catalog. Re-auction filtering stays locked
 * (it is a paid, server-checked feature).
 */
export function StaticMarketplace() {
  const sp = useSearchParams();
  const initial = useMemo(() => runSearch(filtersFromSearchParams(Object.fromEntries(sp.entries())), { allowReauction: false }), [sp]);
  const localSearch = useCallback((input: FilterInput) => runSearch(input, { allowReauction: false }), []);
  return <Marketplace initial={initial} canReauction={false} localSearch={localSearch} />;
}
