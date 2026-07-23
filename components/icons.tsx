/**
 * Inline stroke icons, sized by the `size` prop and coloured via
 * `currentColor` so each call site controls them with plain CSS.
 */

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CubeIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={1.9} className={className} style={style}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 12 12 17 22 12" />
      <polyline points="2 17 12 22 22 17" />
    </svg>
  );
}

export function RefreshIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2.2} className={className} style={style}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}

export function SunIcon({ size = 19, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2.1} className={className} style={style}>
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.4" y2="6.4" />
      <line x1="17.6" y1="17.6" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6.4" y2="17.6" />
      <line x1="17.6" y1="6.4" x2="19.4" y2="4.6" />
    </svg>
  );
}

export function MoonIcon({ size = 19, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2.1} className={className} style={style}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2.4} className={className} style={style}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function SearchIcon({ size = 14, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2.4} className={className} style={style}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </svg>
  );
}

export function PowerIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2.3} className={className} style={style}>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="11" />
    </svg>
  );
}

export function EyeIcon({ size = 17, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2} className={className} style={style}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ size = 17, className, style }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2} className={className} style={style}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/** Zoho's "Z" mark, drawn as a stroke so it inherits the button's white. */
export function ZohoIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path
        d="M6.2 5.6h11.6L6.2 18.4h11.6"
        stroke="#fff"
        strokeWidth={2.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
