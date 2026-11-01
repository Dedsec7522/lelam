import { Badge } from "@/components/ui/primitives";

export type ListingStatus = "draft" | "pending" | "published";

const MAP = {
  draft: { label: "Draft · needs changes", tone: "warning" },
  pending: { label: "In review", tone: "brand" },
  published: { label: "Published", tone: "positive" },
} as const;

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const s = MAP[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
