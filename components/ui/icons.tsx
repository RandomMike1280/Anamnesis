import type { SVGProps } from 'react';

/**
 * Custom SVG icon set for Space of Sonder.
 * Thin 1.5px strokes, currentColor, 24x24 grid — consistent across all
 * platforms, unlike emojis which render differently per system.
 */

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---------- Writing & memories ---------- */

export function PenIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </Svg>
  );
}

export function HourglassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 2h14" />
      <path d="M5 22h14" />
      <path d="M7 2v4l5 6-5 6v4" />
      <path d="M17 2v4l-5 6 5 6v4" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </Svg>
  );
}

export function MailHeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7.5" />
      <path d="m22 7-10 6L2 7" />
      <path d="M18.5 15.5l-.4-.4a1.87 1.87 0 0 0-2.65 2.65l3.05 3.05 3.05-3.05a1.87 1.87 0 0 0-2.65-2.65l-.4.4z" />
    </Svg>
  );
}

/* ---------- Celestial ---------- */

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

export function StarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg fill={filled ? 'currentColor' : 'none'} {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </Svg>
  );
}

/* ---------- Growth (tree stages) ---------- */

export function SproutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 21h10" />
      <path d="M12 21v-8" />
      <path d="M12 13c0-3-2.4-5.5-5.5-5.5H4C4 10.5 6.4 13 9.5 13H12z" />
      <path d="M12 10c0-2.6 2.1-4.7 4.7-4.7H20c0 2.6-2.1 4.7-4.7 4.7H12" />
    </Svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </Svg>
  );
}

export function PlantIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 17h10l-1 4.2a1 1 0 0 1-1 .8H9a1 1 0 0 1-1-.8L7 17z" />
      <path d="M6 17h12" />
      <path d="M12 17v-5" />
      <path d="M12 12c0-2.8-2.2-5-5-5-.2 3 2.2 5 5 5z" />
      <path d="M12 12c0-2.8 2.2-5 5-5 .2 3-2.2 5-5 5z" />
    </Svg>
  );
}

export function TreeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="9" r="6.5" />
      <path d="M12 15.5V22" />
      <path d="M12 18.5l2.5-2" />
      <path d="M12 20l-2.5-2" />
    </Svg>
  );
}

/* ---------- Tasks & progress ---------- */

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </Svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4.5" />
    </Svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-5.5" />
    </Svg>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
    </Svg>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l1.2 3.8L17 12l-3.8 1.2L12 17l-1.2-3.8L7 12l3.8-1.2L12 7z" />
    </Svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Svg>
  );
}

export function DropIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </Svg>
  );
}

/* ---------- Security ---------- */

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

export function UnlockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.83-1.2" />
    </Svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

/* ---------- People & reactions ---------- */

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg fill={filled ? 'currentColor' : 'none'} {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8" />
      <path d="M10 21v-6h4v6" />
    </Svg>
  );
}

export function BalloonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="8.5" rx="5.5" ry="6.5" />
      <path d="M12 15l-1.2 2h2.4L12 15" />
      <path d="M12 17c1 2-1 3.5 0 5" />
    </Svg>
  );
}

export function ThumbsUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 10v12" />
      <path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
    </Svg>
  );
}

export function ZapIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

export function FrownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 16c1-1.5 2.3-2.2 3.5-2.2s2.5.7 3.5 2.2" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
    </Svg>
  );
}

export function HugIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7c-2.5 3-2.5 7 0 10" />
      <path d="M20 7c2.5 3 2.5 7 0 10" />
      <path d="M12 9l-.53-.53a2.75 2.75 0 0 0-3.89 3.89L12 16.75l4.42-4.39a2.75 2.75 0 0 0-3.89-3.89L12 9z" />
    </Svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </Svg>
  );
}

export function PaperclipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    </Svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

/* ---------- Data-driven lookups ---------- */

export const iconMap = {
  sprout: SproutIcon,
  vine: LeafIcon,
  plant: PlantIcon,
  tree: TreeIcon,
  pen: PenIcon,
  book: BookIcon,
  moon: MoonIcon,
  mic: MicIcon,
  hourglass: HourglassIcon,
  mail: MailIcon,
} as const;

export type IconKey = keyof typeof iconMap;
