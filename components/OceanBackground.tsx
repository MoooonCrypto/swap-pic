'use client'

export function OceanBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Deep ocean gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #060d1a 0%, #0a1f3a 40%, #0e3460 70%, #0d7c72 100%)',
        }}
      />

      {/* Stars */}
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 45 + '%',
            background: 'rgba(232, 213, 183, ' + (Math.random() * 0.5 + 0.3) + ')',
            animation: `pulse-glow ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 3 + 's',
          }}
        />
      ))}

      {/* Moon */}
      <div
        className="absolute"
        style={{
          width: '60px',
          height: '60px',
          top: '8%',
          right: '12%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #f5e6c8, #e8d5b7)',
          boxShadow: '0 0 30px rgba(232, 213, 183, 0.4), 0 0 60px rgba(232, 213, 183, 0.15)',
        }}
      />

      {/* Moon reflection on water */}
      <div
        className="absolute"
        style={{
          width: '4px',
          bottom: '28%',
          right: 'calc(12% + 28px)',
          height: '25%',
          background: 'linear-gradient(180deg, rgba(232,213,183,0.4) 0%, transparent 100%)',
          filter: 'blur(3px)',
        }}
      />

      {/* Wave layers */}
      <svg
        className="absolute bottom-0 left-0 w-[200%]"
        style={{ animation: 'wave1 8s ease-in-out infinite' }}
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,100 C180,60 360,140 540,100 C720,60 900,140 1080,100 C1260,60 1440,120 1440,100 L1440,200 L0,200 Z"
          fill="rgba(13,124,114,0.3)"
        />
      </svg>

      <svg
        className="absolute bottom-0 left-0 w-[200%]"
        style={{ animation: 'wave2 10s ease-in-out infinite', marginLeft: '-50%' }}
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,90 C200,130 400,50 600,90 C800,130 1000,50 1200,90 C1350,120 1440,80 1440,90 L1440,180 L0,180 Z"
          fill="rgba(78,205,196,0.15)"
        />
      </svg>

      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 C240,20 480,100 720,60 C960,20 1200,80 1440,60 L1440,120 L0,120 Z"
          fill="rgba(10,31,58,0.8)"
        />
      </svg>
    </div>
  )
}
