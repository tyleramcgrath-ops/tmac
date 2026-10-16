export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="6" ry="14" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" />
      <path d="M2.5 12h27M2.5 20h27" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" />
      <path
        d="M16 23.5s-6-3.7-6-7.6a3.3 3.3 0 0 1 6-1.9 3.3 3.3 0 0 1 6 1.9c0 3.9-6 7.6-6 7.6z"
        fill="var(--accent)"
      />
    </svg>
  );
}
