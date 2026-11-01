"use client";

import { Download, Eye, FileText, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Badge, Card, Stat } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { CrudManager, RowAction, type FieldDef } from "../crud-manager";
import { DOCUMENT_KINDS } from "../options";

export interface DocumentRow {
  id: string;
  name: string;
  kind: string;
  sizeKb: number;
  expiresOn?: string;
  createdAt: string;
}

const DAY = 86_400_000;
const SOON_DAYS = 30;

const fields: FieldDef[] = [
  { name: "name", label: "Document name", type: "text", required: true, placeholder: "e.g. GSTIN certificate 2026", wide: true },
  { name: "kind", label: "Type", type: "select", required: true, options: DOCUMENT_KINDS.map((k) => ({ value: k, label: k })) },
  { name: "expiresOn", label: "Expires on", type: "date", hint: "Optional. We flag it 30 days ahead." },
  { name: "file", label: "Attach file", type: "file", createOnly: true, accept: "application/pdf,image/png,image/jpeg", hint: "Optional. PDF, PNG or JPG up to 5 MB." },
];

function expiry(doc: DocumentRow, now: number) {
  if (!doc.expiresOn) return null;
  const days = Math.ceil((Date.parse(`${doc.expiresOn}T23:59:59+05:30`) - now) / DAY);
  if (days < 0) return { tone: "danger" as const, label: "Expired", days };
  if (days <= SOON_DAYS) return { tone: "warning" as const, label: days === 0 ? "Expires today" : `Expires in ${days}d`, days };
  return { tone: "neutral" as const, label: `Valid to ${formatDate(doc.expiresOn)}`, days };
}

export function DocumentsClient({ initial, now }: { initial: DocumentRow[]; now: number }) {
  return (
    <CrudManager<DocumentRow>
      endpoint="/api/documents"
      initial={initial}
      fields={fields}
      noun="document"
      multipart
      sort={(a, b) => (expiry(a, now)?.days ?? Infinity) - (expiry(b, now)?.days ?? Infinity) || b.createdAt.localeCompare(a.createdAt)}
      empty={{ title: "Your vault is empty", description: "Add your GST certificate, PAN and MSTC registration so they are ready for every auction.", icon: <FileText className="size-5" /> }}
      summary={(items) => {
        const soon = items.filter((d) => {
          const e = expiry(d, now);
          return e && e.days >= 0 && e.days <= SOON_DAYS;
        }).length;
        const expired = items.filter((d) => (expiry(d, now)?.days ?? 1) < 0).length;
        return (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Documents" value={items.length} hint={`${items.filter((d) => d.sizeKb > 0).length} with files`} />
            <Stat label="Expiring soon" value={soon} tone={soon ? "copper" : undefined} hint="Next 30 days" />
            <Stat label="Expired" value={expired} hint="Renew these" />
          </div>
        );
      }}
      renderItem={(d, ctl) => {
        const e = expiry(d, now);
        return (
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper-2 text-muted" aria-hidden>
              {d.sizeKb > 0 ? <Paperclip className="size-5" /> : <FileText className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{d.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge>{d.kind}</Badge>
                {e && <Badge tone={e.tone}>{e.label}</Badge>}
                <span>{d.sizeKb > 0 ? `${d.sizeKb.toLocaleString("en-IN")} KB` : "No file attached"}</span>
                <span>· added {formatDate(d.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-center">
              {d.sizeKb > 0 && (
                <>
                  <a
                    href={`/api/documents/${d.id}/file`}
                    target="_blank"
                    rel="noopener"
                    aria-label={`View ${d.name}`}
                    title="View"
                    className="grid size-11 place-items-center rounded-xl text-muted hover:bg-paper-2 hover:text-ink"
                  >
                    <Eye className="size-[18px]" />
                  </a>
                  <a
                    href={`/api/documents/${d.id}/file?download=1`}
                    aria-label={`Download ${d.name}`}
                    title="Download"
                    className="grid size-11 place-items-center rounded-xl text-muted hover:bg-paper-2 hover:text-ink"
                  >
                    <Download className="size-[18px]" />
                  </a>
                </>
              )}
              <RowAction label="Edit document" onClick={ctl.edit}>
                <Pencil className="size-[18px]" />
              </RowAction>
              <RowAction label="Delete document" tone="danger" onClick={ctl.remove}>
                <Trash2 className="size-[18px]" />
              </RowAction>
            </div>
          </Card>
        );
      }}
    />
  );
}
