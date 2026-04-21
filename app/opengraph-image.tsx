import { ImageResponse } from 'next/og'

export const alt = 'BottleSwap — Send a photo to a stranger. Receive one back.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #060d1a 0%, #0e3460 55%, #0a5f57 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stars */}
        {[
          [120, 60], [340, 90], [600, 40], [820, 110], [1050, 55],
          [200, 180], [480, 150], [750, 200], [980, 160],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              display: 'flex',
            }}
          />
        ))}

        {/* Bottle SVG */}
        <svg width="130" height="286" viewBox="0 0 100 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cork */}
          <rect x="38" y="8" width="24" height="20" rx="4" fill="#c4a882" />
          <rect x="40" y="10" width="20" height="4" rx="2" fill="#d4b896" />
          <rect x="40" y="16" width="20" height="3" rx="1.5" fill="#b8956a" />
          <rect x="40" y="21" width="20" height="2" rx="1" fill="#b8956a" />
          {/* Bottle neck */}
          <path d="M38 28 L35 50 L30 65" stroke="rgba(78,205,196,0.6)" strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M62 28 L65 50 L70 65" stroke="rgba(78,205,196,0.6)" strokeWidth="16" strokeLinecap="round" fill="none" />
          {/* Bottle body */}
          <path d="M30 65 Q20 75 18 95 L18 175 Q18 195 50 200 Q82 195 82 175 L82 95 Q80 75 70 65 Z" fill="rgba(78,205,196,0.25)" stroke="rgba(78,205,196,0.5)" strokeWidth="1.5" />
          {/* Glass shine */}
          <path d="M25 80 Q22 100 22 130" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round" />
          {/* Photo paper inside */}
          <rect x="28" y="90" width="44" height="55" rx="2" fill="rgba(232,213,183,0.3)" transform="rotate(-5 50 117)" />
          {/* Water line */}
          <path d="M20 155 Q35 148 50 155 Q65 162 80 155" stroke="rgba(78,205,196,0.4)" strokeWidth="1.5" fill="none" />
          {/* Neck glass */}
          <path d="M36 28 L34 50 L30 65 L70 65 L66 50 L64 28 Z" fill="rgba(78,205,196,0.2)" stroke="rgba(78,205,196,0.4)" strokeWidth="1" />
          {/* Top rim */}
          <ellipse cx="50" cy="28" rx="14" ry="4" fill="rgba(78,205,196,0.4)" />
        </svg>

        {/* Brand name */}
        <div
          style={{
            color: '#e8dcc8',
            fontSize: '80px',
            fontWeight: 300,
            letterSpacing: '0.08em',
            marginTop: '28px',
            display: 'flex',
          }}
        >
          BottleSwap
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#4ecdc4',
            fontSize: '26px',
            letterSpacing: '0.04em',
            marginTop: '16px',
            opacity: 0.9,
            display: 'flex',
          }}
        >
          Send a photo to a stranger. Receive one back.
        </div>

        {/* Bottom wave */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            background: 'rgba(78,205,196,0.06)',
            borderRadius: '60% 60% 0 0',
            display: 'flex',
          }}
        />
      </div>
    ),
    size,
  )
}
