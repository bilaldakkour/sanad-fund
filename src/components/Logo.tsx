export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="14" fill="#0F172A" />
      <circle cx="19" cy="24" r="9" fill="none" stroke="#FDBA74" strokeWidth="3.4" />
      <circle cx="29" cy="24" r="9" fill="none" stroke="#EA580C" strokeWidth="3.4" />
    </svg>
  );
}
