import "server-only";

// Pure search logic lives in lib so the static (GitHub Pages) build can run it in the browser.
export * from "@/lib/run-search";
