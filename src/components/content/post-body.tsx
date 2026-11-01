import { Lightbulb } from "lucide-react";
import type { Block } from "@/content/blog";

/** Renders structured article blocks as plain React elements (no raw HTML injection). */
export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-lelam">
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`;
        switch (block.type) {
          case "p":
            return <p key={key}>{block.text}</p>;
          case "h2":
            return <h2 key={key}>{block.text}</h2>;
          case "h3":
            return <h3 key={key}>{block.text}</h3>;
          case "ul":
            return (
              <ul key={key}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <aside key={key} className="my-6 flex gap-3 rounded-2xl border border-brand/25 bg-brand-soft p-5 text-[1rem] leading-relaxed text-brand-ink">
                <Lightbulb className="mt-1 size-5 shrink-0" aria-hidden />
                <p className="!m-0">{block.text}</p>
              </aside>
            );
          case "table":
            return (
              <div key={key} className="my-6 overflow-x-auto rounded-2xl border border-line" tabIndex={0} role="region" aria-label="Table, scroll horizontally on small screens">
                <table className="!my-0 min-w-[520px]">
                  <thead>
                    <tr>
                      {block.head.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) =>
                          c === 0 ? (
                            <th key={c} scope="row" className="!bg-transparent">
                              {cell}
                            </th>
                          ) : (
                            <td key={c}>{cell}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default: {
            const exhaustive: never = block;
            return exhaustive;
          }
        }
      })}
    </div>
  );
}
