export function Separator({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-[color:var(--border)] ${className}`} aria-hidden="true" />;
}
