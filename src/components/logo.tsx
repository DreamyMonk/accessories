import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      {/* Phone outline */}
      <rect x="6" y="2" width="12" height="20" rx="2" fill="hsl(var(--primary))" />
      <rect x="8" y="4" width="8" height="14" rx="1" fill="white" />
      {/* Checkmark circle */}
      <circle cx="12" cy="10" r="4" fill="hsl(var(--primary))" />
      <path
        d="M10 10 L11.5 11.5 L14 9"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Home button */}
      <circle cx="12" cy="20" r="1" fill="white" />
    </svg>
  );
}
