export function AuthHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[1.9rem] font-semibold tracking-[-0.025em] text-ink">{title}</h1>
      <p className="mt-2 text-[0.95rem] text-muted">{text}</p>
    </div>
  );
}
