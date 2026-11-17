import { useId, type ReactNode } from "react"

const STARS = [[26, 72], [44, 112], [124, 64], [136, 114], [28, 128], [126, 92], [52, 82]]

// Absolute points, not a transform: the reveal's motion test treats any computed transform as movement.
function starPoints(x: number, y: number) {
  return [[0, -4.5], [1.2, -1.2], [4.5, 0], [1.2, 1.2], [0, 4.5], [-1.2, 1.2], [-4.5, 0], [-1.2, -1.2]]
    .map(([dx, dy]) => `${x + dx},${y + dy}`).join(" ")
}

type Props = { behind?: ReactNode; front?: ReactNode }

export function GiftBox({ behind, front }: Props) {
  const lidClip = `lid${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  return (
    <span aria-hidden="true" className="relative block h-36 w-40 shrink-0">
      {behind}
      <span className="absolute inset-0 block">
        <svg viewBox="0 0 160 148" className="absolute inset-0 h-[148px] w-40 overflow-visible">
          <ellipse cx="80" cy="145" rx="68" ry="3" fill="var(--ink)" opacity="0.12" />
          <path d="M8 40H152V136A8 8 0 0 1 144 144H16A8 8 0 0 1 8 136Z" fill="var(--cranberry)" />
          <path d="M116 40H152V136A8 8 0 0 1 144 144H116Z" fill="var(--cranberry-deep)" opacity="0.7" />
          {STARS.map(([x, y]) => (
            <polygon key={`${x}-${y}`} points={starPoints(x, y)} fill="var(--gold)" opacity="0.55" />
          ))}
          <rect x="8" y="40" width="144" height="6" fill="#4f0d1a" opacity="0.35" />
          <rect x="68" y="40" width="24" height="104" fill="var(--gold)" />
          <rect x="81" y="40" width="11" height="104" fill="var(--gold-ink)" opacity="0.45" />
          <rect x="68" y="40" width="24" height="6" fill="#4f0d1a" opacity="0.25" />
        </svg>
      </span>
      <svg data-gift-lid viewBox="0 0 160 148" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }} className="absolute inset-0 h-[148px] w-40 overflow-visible">
        <clipPath id={lidClip}><rect x="0" y="28" width="160" height="32" rx="6" /></clipPath>
        <g clipPath={`url(#${lidClip})`}>
          <rect x="0" y="28" width="160" height="32" fill="var(--cranberry-deep)" />
          <rect x="0" y="28" width="160" height="7" fill="var(--cranberry)" />
          <rect x="120" y="28" width="40" height="32" fill="#4f0d1a" opacity="0.35" />
          <rect x="68" y="28" width="24" height="32" fill="var(--gold)" />
          <rect x="81" y="35" width="11" height="25" fill="var(--gold-ink)" opacity="0.45" />
        </g>
        <path d="M74 32C60 36 50 40 43 44" fill="none" stroke="var(--gold-ink)" strokeWidth="1.2" />
        <path d="M47 42 31 46 34 58 50 54Z" fill="var(--paper)" />
        <path d="M47 42 31 46 32 50 48 46Z" fill="var(--cream-deep)" />
        <circle cx="44" cy="45.5" r="1.4" fill="var(--gold-ink)" />
        <path d="M77 31 68 47 72.5 45.5 73.5 50 80 33Z" fill="var(--gold-ink)" />
        <path d="M83 31 92 47 87.5 45.5 86.5 50 80 33Z" fill="var(--gold)" />
        <path d="M80 30C62 32 47 22 53 11 59 1 74 13 80 30Z" fill="var(--gold)" />
        <path d="M77.5 27C66 25.5 58 19 60.5 14 64 8.5 72.5 16.5 77.5 27Z" fill="var(--gold-ink)" opacity="0.55" />
        <path d="M80 30C98 32 113 22 107 11 101 1 86 13 80 30Z" fill="var(--gold)" />
        <path d="M82.5 27C94 25.5 102 19 99.5 14 96 8.5 87.5 16.5 82.5 27Z" fill="var(--gold-ink)" opacity="0.55" />
        <ellipse cx="80" cy="30" rx="6.5" ry="5.5" fill="var(--gold)" />
        <ellipse cx="81.5" cy="31" rx="4" ry="3.5" fill="var(--gold-ink)" opacity="0.35" />
        <ellipse cx="78" cy="28.2" rx="2.2" ry="1.4" fill="#e2bd6e" />
      </svg>
      {front}
    </span>
  )
}
