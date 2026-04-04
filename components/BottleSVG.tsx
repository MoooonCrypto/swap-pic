'use client'

interface BottleSVGProps {
  hasImage?: boolean
  size?: number
  className?: string
  showCork?: boolean
  corkPopped?: boolean
}

export function BottleSVG({
  hasImage = false,
  size = 120,
  className = '',
  showCork = true,
  corkPopped = false,
}: BottleSVGProps) {
  return (
    <svg
      width={size}
      height={size * 2.2}
      viewBox="0 0 100 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cork */}
      {showCork && (
        <g className={corkPopped ? 'animate-cork-pop' : ''}>
          <rect x="38" y="8" width="24" height="20" rx="4" fill="#c4a882" />
          <rect x="40" y="10" width="20" height="4" rx="2" fill="#d4b896" />
          <rect x="40" y="16" width="20" height="3" rx="1.5" fill="#b8956a" />
          <rect x="40" y="21" width="20" height="2" rx="1" fill="#b8956a" />
        </g>
      )}

      {/* Bottle neck */}
      <path
        d="M38 28 L35 50 L30 65"
        stroke="rgba(78,205,196,0.6)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M62 28 L65 50 L70 65"
        stroke="rgba(78,205,196,0.6)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottle body */}
      <path
        d="M30 65 Q20 75 18 95 L18 175 Q18 195 50 200 Q82 195 82 175 L82 95 Q80 75 70 65 Z"
        fill="rgba(78,205,196,0.25)"
        stroke="rgba(78,205,196,0.5)"
        strokeWidth="1.5"
      />

      {/* Glass shine */}
      <path
        d="M25 80 Q22 100 22 130"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 72 Q27 80 27 90"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Image inside bottle */}
      {hasImage && (
        <>
          <clipPath id="bottleClip">
            <path d="M23 95 Q22 80 30 70 L70 70 Q78 80 77 95 L77 175 Q77 192 50 196 Q23 192 23 175 Z" />
          </clipPath>
          <rect
            x="23"
            y="75"
            width="54"
            height="120"
            fill="rgba(232,213,183,0.15)"
            clipPath="url(#bottleClip)"
          />
          {/* Photo paper */}
          <g clipPath="url(#bottleClip)">
            <rect x="28" y="90" width="44" height="55" rx="2" fill="rgba(232,213,183,0.3)" transform="rotate(-5 50 117)" />
          </g>
        </>
      )}

      {/* Water line inside */}
      <path
        d="M20 155 Q35 148 50 155 Q65 162 80 155"
        stroke="rgba(78,205,196,0.4)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Bottle neck glass */}
      <path
        d="M36 28 L34 50 L30 65 L70 65 L66 50 L64 28 Z"
        fill="rgba(78,205,196,0.2)"
        stroke="rgba(78,205,196,0.4)"
        strokeWidth="1"
      />

      {/* Top rim */}
      <ellipse cx="50" cy="28" rx="14" ry="4" fill="rgba(78,205,196,0.4)" />
    </svg>
  )
}
