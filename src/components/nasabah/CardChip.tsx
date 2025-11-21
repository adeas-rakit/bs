'use client';

export function CardChip() {
  return (
    <svg
      width="40" // Reduced size for a more compact look
      height="32" // Reduced size
      viewBox="0 0 40 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-80"
    >
      <rect width="40" height="32" rx="6" fill="#d1d5db" />
      <path
        d="M10 16H4M10 8H4M10 24H4M30 16H36M30 8H36M30 24H36M20 6V0M20 32V26"
        stroke="#a1a1aa" // A slightly darker, less saturated gray
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="10" y="6" width="20" height="20" rx="4" fill="#e5e7eb" />
      <path
        d="M15 11.5H25M15 20.5H25M12 16H28"
        stroke="#a1a1aa"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
